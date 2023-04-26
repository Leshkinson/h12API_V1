import {Model, RefType} from "mongoose";
import {ILikeStatus, ILikeStatusWithoutId, UpgradeLikes} from "../ts/interfaces";
import {LikeModel} from "../models/like-model";

export class LikeRepository {
    private likeModel: Model<ILikeStatus | ILikeStatusWithoutId>;

    constructor() {
        this.likeModel = LikeModel;
    }

    public async createLike(commentOrPostId: string, userId: string, likeStatus: string): Promise<ILikeStatus | ILikeStatusWithoutId> {
        return this.likeModel.create({userId, likeStatus, commentOrPostId})
    }

    public async updateLikeStatus(id: RefType, likeStatus: string): Promise<ILikeStatus| ILikeStatusWithoutId | null> {
        return this.likeModel.findOneAndUpdate({_id: id}, {"likeStatus": likeStatus})
    }

    public async findLike(userId: string, commentOrPostId: string): Promise<ILikeStatus | ILikeStatusWithoutId | null> {
        return this.likeModel.findOne({$and:[{userId}, {commentOrPostId}]})
    }

    public async findLikeById(id: RefType): Promise<ILikeStatus | null> {
        return this.likeModel.findById(id)
    }

    public async findLikes(id: RefType): Promise<ILikeStatus[] | ILikeStatusWithoutId[] | null> {
        return this.likeModel.find({$and:[{commentOrPostId: id}, {"likeStatus": "Like"}]}).sort({"createdAt": "desc"}).limit(3).select({_id: 0}).lean()
    }

    public async countingLikeOrDislike(commentOrPostId: string, param: string): Promise<number> {
        return this.likeModel.find({$and: [{"commentOrPostId": commentOrPostId}, {"likeStatus": param}]}).count()
    }

    public async deleteAll() {
        return this.likeModel.deleteMany();
    }


}