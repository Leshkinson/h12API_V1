import {JwtPayload} from "jsonwebtoken";
import {BlogModel} from "../models/blog-model";
import {PostModel} from "../models/post-model";
import {UserModel} from "../models/user-model";
import {CommentModel} from "../models/comment-model";
import mongoose, {Model, RefType, SortOrder} from "mongoose";
import {JWT, TokenService} from "../application/token-service";
import {BlogsRepository} from "../repositories/blogs-repository";
import {PostsRepository} from "../repositories/posts-repository";
import {UsersRepository} from "../repositories/users-repository";
import {CommentsRepository} from "../repositories/comments-repository";
import {IBlog, IComment, ILikeStatus, IPost, IUser} from "../ts/interfaces";
import {LikeRepository} from "../repositories/like-repository";
import {UserService} from "./user-service";
import {CommentService} from "./comment-service";
import {PostService} from "./post-service";

export class QueryService {
    private blogRepository: BlogsRepository;
    private postRepository: PostsRepository;
    private userRepository: UsersRepository;
    private likeRepository: LikeRepository;
    private commentRepository: CommentsRepository;
    private postModel: Model<IPost>;
    private blogModel: Model<IBlog>;
    private userModel: Model<IUser>;
    private commentModel: Model<IComment>;

    constructor() {
        this.blogRepository = new BlogsRepository();
        this.postRepository = new PostsRepository();
        this.userRepository = new UsersRepository();
        this.likeRepository = new LikeRepository();
        this.commentRepository = new CommentsRepository();
        this.postModel = PostModel;
        this.blogModel = BlogModel;
        this.userModel = UserModel;
        this.commentModel = CommentModel;
    }

    public async getTotalCountForBlogs(searchNameTerm: string | undefined | object): Promise<number> {
        if (searchNameTerm)
            searchNameTerm = {name: {$regex: new RegExp(`.*${searchNameTerm}.*`, 'i')}};

        return await this.blogRepository.getBlogsCount(searchNameTerm);
    }

    public async getTotalCountForUsers(searchLoginTerm: string | undefined | object, searchEmailTerm: string | undefined | object): Promise<number> {
        if (searchLoginTerm)
            searchLoginTerm = {login: {$regex: new RegExp(`.*${searchLoginTerm}.*`, 'i')}};
        if (searchEmailTerm)
            searchEmailTerm = {email: {$regex: new RegExp(`.*${searchEmailTerm}.*`, 'i')}};

        return await this.userRepository.getUsersCount(searchLoginTerm, searchEmailTerm);
    }


    public async getTotalCountForPosts(): Promise<number> {
        return this.postModel.find().count();
    }

    public async getTotalCountPostsForTheBlog(blogId: RefType): Promise<number> {
        const blog = await this.blogRepository.getOneBlog(blogId);

        return this.postModel.find({blogId: (blog?._id)?.toString()}).count();
    }

    public async createPostForTheBlog(
        blogId: RefType,
        title: string,
        shortDescription: string,
        content: string): Promise<IPost> {
        const blog = await this.blogRepository.getOneBlog(blogId);
        if (blog) {
            const blogId = new mongoose.Types.ObjectId((blog?._id).toString());

            return await this.postModel.create({title, shortDescription, content, blogId, blogName: blog?.name});
        }
        throw new Error();
    }

    public async getPostsForTheBlog(
        blogId: RefType,
        pageNumber: number = 1,
        pageSize: number = 10,
        sortBy: string = 'createdAt',
        sortDirection: SortOrder = 'desc'): Promise<IPost[]> {
        const blog = await this.blogRepository.getOneBlog(blogId);
        const skip: number = (+pageNumber - 1) * +pageSize;
        if (blog) {
            return this.postModel.find({blogId: (blog?._id)?.toString()}).sort({[sortBy]: sortDirection}).skip(skip).limit(+pageSize);
        }
        throw new Error();
    }

    public async createCommentForThePost(postId: RefType, content: string, token: string): Promise<IComment> {
        const tokenService = new TokenService();
        const commentRepository = new CommentsRepository()
        const post = await this.postRepository.getOnePost(postId);
        if (post) {
            const payload = await tokenService.getPayloadByAccessToken(token) as JWT
            const user = await this.userRepository.findUserById(payload.id)
            if (user) {
                return await commentRepository.createComment(content, postId, payload.id, user.login)
            }
        }

        throw new Error();
    }

    public async getCommentsForThePost(
        postId: RefType,
        pageNumber: number = 1,
        pageSize: number = 10,
        sortBy: string = 'createdAt',
        sortDirection: SortOrder = 'desc'): Promise<IComment[]> {

        const post = await this.postRepository.getOnePost(postId);
        const skip: number = (+pageNumber - 1) * +pageSize;
        if (post) {
            return this.commentModel.find({postId: (post?._id)?.toString()}).sort({[sortBy]: sortDirection}).skip(skip).limit(+pageSize)
        }
        throw new Error();
    }

    public async getTotalCountCommentsForThePost(postId: RefType): Promise<number> {
        const post = await this.postRepository.getOnePost(postId);

        return this.commentModel.find({postId: (post?._id)?.toString()}).count();
    }

    public async makeLikeStatusForTheComment(likeStatus: string, commentId: string, userId: string): Promise<ILikeStatus | null> {
        const like = await this.likeRepository.findLike(userId, commentId);
        if (like) {
            return await this.changeLikeStatusForTheComment(String(like?._id), likeStatus);
        }

        return await this.likeRepository.createLike(commentId, userId, likeStatus);
    }

    public async changeLikeStatusForTheComment(likeId: string, likeStatus: string): Promise<ILikeStatus | null> {
        const like = await this.likeRepository.findLikeById(likeId);
        if(like?.likeStatus !== likeStatus){
            // return await this.likeRepository.updateLikeStatus(likeId, 'None')
            return await this.likeRepository.updateLikeStatus(likeId, likeStatus)
        }
        return like
    }

    public async getTotalCountLikeOrDislike(commentId: string, param: string) {
        const comment = await this.commentRepository.getOneComment(commentId)
        if (comment) {
            return await this.likeRepository.countingLikeOrDislike(String(comment._id), param)
        }

        throw new Error()
    }

    public async getLikeStatus(userId: string, commentId: string) {
        const like = await this.likeRepository.findLike(userId, commentId);
        if (like)
            return like.likeStatus
    }

    public async setUpLikeOrDislikeStatus(token: string, commentOrPostId: string, likeStatus: string, service: CommentService | PostService): Promise<ILikeStatus | null> {
        const userService = new UserService();
        const tokenService = new TokenService();

        const payload = await tokenService.getPayloadByAccessToken(token) as JWT;
        const user = await userService.getUserById(payload.id);
        const commentOrPost: IComment | IPost | undefined = await service.getOne(commentOrPostId);
        if (!user || !commentOrPost) {
            throw new Error()
            // res.sendStatus(404);
            //
            // return;
        }
        return await this.makeLikeStatusForTheComment(likeStatus, commentOrPostId, String(user._id));
    }

    public async testingDelete(): Promise<void> {
        await this.likeRepository.deleteAll();
    }
}