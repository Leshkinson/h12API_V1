import {Model, RefType} from "mongoose";
import {ILikeStatus} from "../ts/interfaces";
import {LikeModel} from "../models/like-model";

export class LikeRepository {
    private likeModel: Model<ILikeStatus>;

    constructor() {
        this.likeModel = LikeModel;
    }

    public async createLike(commentOrPostId: string, userId: string, likeStatus: string): Promise<ILikeStatus> {
        return this.likeModel.create({userId, likeStatus, commentOrPostId})
    }

    public async updateLikeStatus(id: RefType, likeStatus: string): Promise<ILikeStatus | null> {
        return this.likeModel.findOneAndUpdate({_id: id}, {"likeStatus": likeStatus})
    }

    public async findLike(userId: string, commentOrPostId: string): Promise<ILikeStatus | null> {
        return this.likeModel.findOne({$and:[{userId}, {commentOrPostId}]})
    }

    public async findLikeById(id: RefType): Promise<ILikeStatus | null> {
        return this.likeModel.findById(id)
    }

    public async findLikes(id: RefType): Promise<ILikeStatus[] | null> {
        return this.likeModel.find({$and:[{commentOrPostId: id}, {"likeStatus": "Like"}]}).sort({"createdAt": "desc"}).limit(3)
    }

    public async countingLikeOrDislike(commentOrPostId: string, param: string) {
        return this.likeModel.find({$and: [{"commentOrPostId": commentOrPostId}, {"likeStatus": param}]}).count()
    }

    public async deleteAll() {
        return this.likeModel.deleteMany();
    }
}