import {Request, Response} from "express";
import {IBlog, ILikeStatus, IPost, UpgradeLikes} from "../ts/interfaces";
import {BlogService} from "../services/blog-service";
import {QueryService} from "../services/query-service";
import {BlogsRequest, BlogsRequestWithoutSNT, LikesStatusCfgValues} from "../ts/types";
import {UserService} from "../services/user-service";
import {JWT, TokenService} from "../application/token-service";
import {PostService} from "../services/post-service";
import {LikesStatus} from "../const/const";

export class BlogController {
    static async getAllBlogs(req: Request, res: Response) {
        try {
            const blogService = new BlogService();
            const queryService = new QueryService();

            let {pageNumber, pageSize, sortBy, searchNameTerm, sortDirection} = req.query as BlogsRequest;
            pageNumber = Number(pageNumber ?? 1);
            pageSize = Number(pageSize ?? 10);

            const blogs: IBlog[] = await blogService.getAll(searchNameTerm, pageNumber, pageSize, sortBy, sortDirection);
            const totalCount: number = await queryService.getTotalCountForBlogs(searchNameTerm);

            res.status(200).json({
                "pagesCount": Math.ceil(totalCount / pageSize),
                "page": pageNumber,
                "pageSize": pageSize,
                "totalCount": totalCount,
                "items": blogs,
            });
        } catch (error) {
            if (error instanceof Error)
                throw new Error(error.message);
        }
    }

    static async createBlog(req: Request, res: Response) {
        try {
            const blogService = new BlogService();

            const {name, description, websiteUrl} = req.body;
            const newBlogs: IBlog = await blogService.create(name, description, websiteUrl);

            res.status(201).json(newBlogs);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
        }
    }

    static async getOneBlog(req: Request, res: Response) {
        try {
            const blogService = new BlogService();

            const {id} = req.params;
            const findBlog: IBlog | undefined = await blogService.getOne(id);

            res.status(200).json(findBlog);
        } catch (error) {
            if (error instanceof Error) {
                res.sendStatus(404);
                console.log(error.message);
            }
        }
    }

    static async updateBlog(req: Request, res: Response) {
        try {
            const blogService = new BlogService();

            const {id} = req.params;
            const {name, description, websiteUrl} = req.body;
            const updateBlog: IBlog | undefined = await blogService.update(id, name, description, websiteUrl);

            if (updateBlog) res.sendStatus(204);
        } catch (error) {
            if (error instanceof Error) {
                res.sendStatus(404);
                console.log(error.message);
            }
        }
    }

    static async deleteBlog(req: Request, res: Response) {
        try {
            const blogService = new BlogService();

            const {id} = req.params;
            await blogService.delete(id);

            res.sendStatus(204);
        } catch (error) {
            if (error instanceof Error) {
                res.sendStatus(404);
                console.log(error.message);
            }
        }
    }

    static async getAllPostsForTheBlog(req: Request, res: Response) {
        try {
            const userService = new UserService();
            const tokenService = new TokenService();
            const queryService = new QueryService();
            const postService = new PostService();

            const {blogId} = req.params;
            console.log(' blog', blogId)
            const token = req.headers.authorization?.split(' ')[1];
            let {pageNumber, pageSize, sortDirection, sortBy} = req.query as BlogsRequestWithoutSNT;
            pageNumber = Number(pageNumber ?? 1);
            pageSize = Number(pageSize ?? 10);

            const posts: IPost[] = await queryService.getPostsForTheBlog(blogId, pageNumber, pageSize, sortBy, sortDirection);
            console.log('posts blog', posts)
            const totalCount: number = await queryService.getTotalCountPostsForTheBlog(blogId);
            if (posts) {
                if (token) {
                    console.log('token blog', token)
                    const payload = await tokenService.getPayloadByAccessToken(token) as JWT;
                    const user = await userService.getUserById(payload.id);
                    console.log('user blog', user)
                    if (user) {
                        const upgradePosts = posts.map(async (post: IPost): Promise<IPost> => {
                            post.extendedLikesInfo.likesCount = await queryService.getTotalCountLikeOrDislike(String(post._id), LikesStatus.LIKE, postService);
                            post.extendedLikesInfo.dislikesCount = await queryService.getTotalCountLikeOrDislike(String(post._id), LikesStatus.DISLIKE, postService);
                            const myStatus = await queryService.getLikeStatus(String(user._id), String(post._id)) as LikesStatusCfgValues;
                            if (myStatus)
                                post.extendedLikesInfo.myStatus = myStatus;
                            const likes = await queryService.getLikes(String(post._id)) as ILikeStatus[];
                            const upgradeLikes = likes.map(async (like: ILikeStatus): Promise<UpgradeLikes | undefined> => {
                                const user = await userService.getUserById(like.userId)
                                if (user) {
                                    return {
                                        addedAt: like.createdAt,
                                        userId: like.userId,
                                        login: user.login,
                                    }
                                }
                            })
                            post.extendedLikesInfo.newestLikes = await Promise.all(upgradeLikes)
                            return post
                        })
                        console.log('upgradePosts blog1',await Promise.all(upgradePosts))
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
                    const likes = await queryService.getLikes(String(post._id)) as ILikeStatus[];
                    console.log('5')
                    const upgradeLikes = likes.map(async (like: ILikeStatus): Promise<UpgradeLikes | undefined> => {
                        const user = await userService.getUserById(like.userId)
                        if (user) {
                            console.log('like.createdAt', like.createdAt)
                            return {
                                addedAt: like.createdAt,
                                userId: like.userId,
                                login: user.login,
                            }
                        }
                    })

                    post.extendedLikesInfo.likesCount = await queryService.getTotalCountLikeOrDislike(String(post._id), LikesStatus.LIKE, postService);
                    post.extendedLikesInfo.dislikesCount = await queryService.getTotalCountLikeOrDislike(String(post._id), LikesStatus.DISLIKE, postService);
                    post.extendedLikesInfo.newestLikes = await Promise.all(upgradeLikes)
                    return post
                })
                console.log('upgradePosts blog2', await Promise.all(upgradePosts))
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
                res.sendStatus(404);
                console.log(error.message);
            }
        }
    }

    static async createPostTheBlog(req: Request, res: Response) {
        try {
            const queryService = new QueryService();

            const {blogId} = req.params;
            const {title, shortDescription, content} = req.body;
            const newPost: IPost | undefined = await queryService.createPostForTheBlog(blogId, title, shortDescription, content);

            if (newPost) res.status(201).json(newPost);
        } catch (error) {
            if (error instanceof Error) {
                res.sendStatus(404);
                console.log(error.message);
            }
        }
    }
}