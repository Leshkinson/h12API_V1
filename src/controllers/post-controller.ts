import {Request, Response} from "express";
import {LikesStatus} from "../const/const";
import {IComment, IPost} from "../ts/interfaces";
import {PostService} from "../services/post-service";
import {UserService} from "../services/user-service";
import {QueryService} from "../services/query-service";
import {CommentService} from "../services/comment-service";
import {JWT, TokenService} from "../application/token-service";
import {CommentsRequest, LikesStatusCfgValues, PostsRequest} from "../ts/types";

export class PostController {
    static async getAllPosts(req: Request, res: Response) {
        try {
            const queryService = new QueryService();
            const postService = new PostService();

            const token = req.headers.authorization?.split(' ')[1];
            let {pageNumber, pageSize, sortBy, sortDirection} = req.query as PostsRequest;
            pageNumber = Number(pageNumber ?? 1);
            pageSize = Number(pageSize ?? 10);

            const posts: IPost[] = await postService.getAll(pageNumber, pageSize, sortBy, sortDirection);

            const totalCount: number = await queryService.getTotalCountForPosts();
            if (posts) {

                res.status(200).json({
                    "pagesCount": Math.ceil(totalCount / pageSize),
                    "page": pageNumber,
                    "pageSize": pageSize,
                    "totalCount": totalCount,
                    "items": await queryService.getUpgradePosts(posts, token, postService)
                })
            }
        } catch (error) {
            if (error instanceof Error) {
                console.log(error.message);
            }
        }
    }

    static async createPost(req: Request, res: Response) {
        try {
            const postService = new PostService();

            const {title, shortDescription, content, blogId} = req.body;
            const newPost: IPost | undefined = await postService.create(title, shortDescription, content, blogId);

            if (newPost) res.status(201).json(newPost);
        } catch (error) {
            if (error instanceof Error) {
                console.log(error.message);
            }
        }
    }

    static async getOnePost(req: Request, res: Response) {
        try {
            const queryService = new QueryService();
            const postService = new PostService();

            const {id} = req.params;
            const token = req.headers.authorization?.split(' ')[1];
            const findPost: IPost | undefined = await postService.getOne(id);
            if (findPost) {
                const newFindPost = await queryService.getUpgradePosts(findPost, token, postService);

                res.status(200).json(newFindPost);
            }
        } catch (error) {
            if (error instanceof Error) {
                res.sendStatus(404);
                console.log(error.message);
            }
        }
    }

    static async updatePost(req: Request, res: Response) {
        try {
            const postService = new PostService();

            const {id} = req.params;
            const {title, shortDescription, content, blogId} = req.body;

            const updatePost: IPost | undefined = await postService.update(id, title, shortDescription, content, blogId);
            if (updatePost) res.sendStatus(204);
        } catch (error) {
            if (error instanceof Error) {
                res.sendStatus(404);
                console.log(error.message);
            }
        }
    }

    static async deletePost(req: Request, res: Response) {
        try {
            const postService = new PostService();

            const {id} = req.params;
            await postService.delete(id);

            res.sendStatus(204);
        } catch (error) {
            if (error instanceof Error) {
                res.sendStatus(404);
                console.log(error.message);
            }
        }
    }

    static async createCommentThePost(req: Request, res: Response) {
        try {
            const queryService = new QueryService();

            const {postId} = req.params;
            const {content} = req.body;
            const token = req.headers.authorization?.split(' ')[1];
            if (token) {
                const newComment: IComment | undefined = await queryService.createCommentForThePost(postId, content, token)
                if (newComment) res.status(201).json(newComment)
            }
        } catch (error) {
            if (error instanceof Error) {
                res.sendStatus(404);
                console.log(error.message);
            }
        }
    }

    static async getAllCommentsForThePost(req: Request, res: Response) {
        try {
            const userService = new UserService();
            const tokenService = new TokenService();
            const queryService = new QueryService();
            const commentService = new CommentService();

            const {postId} = req.params;
            const token = req.headers.authorization?.split(' ')[1];

            let {pageNumber, pageSize, sortDirection, sortBy} = req.query as CommentsRequest;
            pageNumber = Number(pageNumber ?? 1);
            pageSize = Number(pageSize ?? 10);

            const comments: IComment[] = await queryService.getCommentsForThePost(postId, pageNumber, pageSize, sortBy, sortDirection);
            const totalCount: number = await queryService.getTotalCountCommentsForThePost(postId);
            if (token) {
                const payload = await tokenService.getPayloadByAccessToken(token) as JWT;
                const user = await userService.getUserById(payload.id);
                if (user) {
                    const upgradeComments: Promise<IComment>[] = comments.map(async (comment: IComment) => {
                        comment.likesInfo.likesCount = await queryService.getTotalCountLikeOrDislike(String(comment._id), LikesStatus.LIKE, commentService);
                        comment.likesInfo.dislikesCount = await queryService.getTotalCountLikeOrDislike(String(comment._id), LikesStatus.DISLIKE, commentService);
                        const myStatus = await queryService.getLikeStatus(String(user._id), String(comment._id)) as LikesStatusCfgValues;
                        if (myStatus)
                            comment.likesInfo.myStatus = myStatus;

                        return comment
                    })

                    res.status(200).json({
                        "pagesCount": Math.ceil(totalCount / pageSize),
                        "page": pageNumber,
                        "pageSize": pageSize,
                        "totalCount": totalCount,
                        "items": await Promise.all(upgradeComments)
                    })

                    return;
                }
            }

            const upgradeComments = comments.map(async comment => {
                comment.likesInfo.likesCount = await queryService.getTotalCountLikeOrDislike(String(comment._id), LikesStatus.LIKE, commentService);
                comment.likesInfo.dislikesCount = await queryService.getTotalCountLikeOrDislike(String(comment._id), LikesStatus.DISLIKE, commentService);

                return comment;
            })
            res.status(200).json({
                "pagesCount": Math.ceil(totalCount / pageSize),
                "page": pageNumber,
                "pageSize": pageSize,
                "totalCount": totalCount,
                "items": await Promise.all(upgradeComments)
            })
        } catch (error) {
            if (error instanceof Error) {
                res.sendStatus(404);
                console.log(error.message);
            }
        }
    }

    static async sendLikeOrDislikeStatus(req: Request, res: Response) {
        try {
            const postService = new PostService();
            const queryService = new QueryService();

            const {postId} = req.params;
            const {likeStatus} = req.body;
            const token = req.headers.authorization?.split(' ')[1];
            if (token) {
                await queryService.setUpLikeOrDislikeStatus(token, postId, likeStatus, postService)
                res.sendStatus(204);
            }
        } catch (error) {
            if (error instanceof Error) {
                res.sendStatus(404);
                console.log(error.message);
            }
        }
    }
}