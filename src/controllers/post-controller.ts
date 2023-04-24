import {Request, Response} from "express";
import {LikesStatus} from "../const/const";
import {PostService} from "../services/post-service";
import {UserService} from "../services/user-service";
import {QueryService} from "../services/query-service";
import {IComment, ILikeStatusWithoutId, IPost, UpgradeLikes} from "../ts/interfaces";
import {JWT, TokenService} from "../application/token-service";
import {CommentsRequest, LikesStatusCfgValues, PostsRequest} from "../ts/types";
import {CommentService} from "../services/comment-service";

export class PostController {
    static async getAllPosts(req: Request, res: Response) {
        try {
            const userService = new UserService();
            const tokenService = new TokenService();
            const queryService = new QueryService();
            const postService = new PostService();

            const token = req.headers.authorization?.split(' ')[1];
            let {pageNumber, pageSize, sortBy, sortDirection} = req.query as PostsRequest;
            pageNumber = Number(pageNumber ?? 1);
            pageSize = Number(pageSize ?? 10);

            const posts: IPost[] = await postService.getAll(pageNumber, pageSize, sortBy, sortDirection);

            const totalCount: number = await queryService.getTotalCountForPosts();
            if (posts) {
                if (token) {
                    const payload = await tokenService.getPayloadByAccessToken(token) as JWT;
                    const user = await userService.getUserById(payload.id);
                    if (user) {
                        const upgradePosts = posts.map(async (post: IPost): Promise<IPost> => {
                            post.extendedLikesInfo.likesCount = await queryService.getTotalCountLikeOrDislike(String(post._id), LikesStatus.LIKE, postService);
                            post.extendedLikesInfo.dislikesCount = await queryService.getTotalCountLikeOrDislike(String(post._id), LikesStatus.DISLIKE, postService);
                            const myStatus = await queryService.getLikeStatus(String(user._id), String(post._id)) as LikesStatusCfgValues;
                            if (myStatus)
                                post.extendedLikesInfo.myStatus = myStatus;
                            const likes = await queryService.getLikes(String(post._id)) as ILikeStatusWithoutId[];

                            async function getUpgradeLikes(likes: ILikeStatusWithoutId[]): Promise<(UpgradeLikes | undefined)[]> {
                                const result: (UpgradeLikes | undefined)[]  = await Promise.all(
                                    likes.map(async (like: ILikeStatusWithoutId): Promise<UpgradeLikes | undefined> => {
                                            const user = await userService.getUserById(like.userId)
                                            if (user) {
                                                return {
                                                    addedAt: like.createdAt,
                                                    userId: like.userId,
                                                    login: user.login,
                                                }
                                            }
                                        }
                                    ));

                                return result.filter((item: UpgradeLikes | undefined) => !!item);
                            }

                            post.extendedLikesInfo.newestLikes = await getUpgradeLikes(likes) as UpgradeLikes[];

                            return post
                        })

                        res.status(200).json({
                            "pagesCount": Math.ceil(totalCount / pageSize),
                            "page": pageNumber,
                            "pageSize": pageSize,
                            "totalCount": totalCount,
                            "items": await Promise.all(upgradePosts)
                        })
                    }
                }
                const upgradePosts = posts.map(async (post: IPost): Promise<IPost> => {
                    const likes = await queryService.getLikes(String(post._id)) as ILikeStatusWithoutId[];
                    const upgradeLikes = likes.map(async (like: ILikeStatusWithoutId): Promise<UpgradeLikes | undefined> => {
                        const user = await userService.getUserById(like.userId)
                        if (user) {
                            return {
                                addedAt: like.createdAt,
                                userId: like.userId,
                                login: user.login,
                            }
                        }
                    })
                    post.extendedLikesInfo.likesCount = await queryService.getTotalCountLikeOrDislike(String(post._id), LikesStatus.LIKE, postService);
                    post.extendedLikesInfo.dislikesCount = await queryService.getTotalCountLikeOrDislike(String(post._id), LikesStatus.DISLIKE, postService);
                    post.extendedLikesInfo.newestLikes = await Promise.all(upgradeLikes) as UpgradeLikes[];

                    return post;
                })

                res.status(200).json({
                    "pagesCount": Math.ceil(totalCount / pageSize),
                    "page": pageNumber,
                    "pageSize": pageSize,
                    "totalCount": totalCount,
                    "items": await Promise.all(upgradePosts)
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
            const userService = new UserService();
            const tokenService = new TokenService();
            const queryService = new QueryService();
            const postService = new PostService();

            const {id} = req.params;
            const token = req.headers.authorization?.split(' ')[1];
            const findPost: IPost | undefined = await postService.getOne(id);
            if (findPost) {
                if (token) {
                    const payload = await tokenService.getPayloadByAccessToken(token) as JWT;
                    const user = await userService.getUserById(payload.id);
                    if (user) {
                        findPost.extendedLikesInfo.likesCount = await queryService.getTotalCountLikeOrDislike(id, LikesStatus.LIKE, postService);
                        findPost.extendedLikesInfo.dislikesCount = await queryService.getTotalCountLikeOrDislike(id, LikesStatus.DISLIKE, postService);
                        const myStatus = await queryService.getLikeStatus(String(user._id), String(findPost._id)) as LikesStatusCfgValues;
                        if (myStatus)
                            findPost.extendedLikesInfo.myStatus = myStatus;
                        const likes = await queryService.getLikes(id) as ILikeStatusWithoutId[];
                        // const upgradeLikes = likes.map(async (like: ILikeStatusWithoutId): Promise<UpgradeLikes | undefined> => {
                        //     const user = await userService.getUserById(like.userId)
                        //     if (user) {
                        //         return {
                        //             addedAt: like.createdAt,
                        //             userId: like.userId,
                        //             login: user.login,
                        //         }
                        //     }
                        // })

                        async function getUpgradeLikes(likes: ILikeStatusWithoutId[]): Promise<(UpgradeLikes | undefined)[]> {
                            const result: (UpgradeLikes | undefined)[] = await Promise.all(
                                likes.map(async (like: ILikeStatusWithoutId): Promise<UpgradeLikes | undefined> => {
                                        const user = await userService.getUserById(like.userId)
                                        if (user) {
                                            return {
                                                addedAt: like.createdAt,
                                                userId: like.userId,
                                                login: user.login,
                                            }
                                        }
                                    }
                                ));

                            return result.filter((item: UpgradeLikes | undefined) => !!item);
                        }

                        findPost.extendedLikesInfo.newestLikes = await getUpgradeLikes(likes);

                        res.status(200).json(findPost);

                        return;
                    }
                }
                const likes = await queryService.getLikes(id) as ILikeStatusWithoutId[];
                const upgradeLikes = likes.map(async (like: ILikeStatusWithoutId) => {
                    const user = await userService.getUserById(like.userId)
                    if (user) {
                        return {
                            addedAt: like.createdAt,
                            userId: like.userId,
                            login: user.login,
                        }
                    }
                })

                findPost.extendedLikesInfo.likesCount = await queryService.getTotalCountLikeOrDislike(id, LikesStatus.LIKE, postService);
                findPost.extendedLikesInfo.dislikesCount = await queryService.getTotalCountLikeOrDislike(id, LikesStatus.DISLIKE, postService);
                findPost.extendedLikesInfo.newestLikes = await Promise.all(upgradeLikes);

                res.status(200).json(findPost);
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
            const token = req.headers.authorization?.split(' ')[1]
            if (token) {
                const newComment: IComment | undefined = await queryService.createCommentForThePost(postId, content, token)
                console.log({newComment})
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