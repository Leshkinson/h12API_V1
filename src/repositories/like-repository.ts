import {Model, RefType} from "mongoose";
import {ILikeStatus} from "../ts/interfaces";
import {LikeModel} from "../models/like-model";

export class LikeRepository {
    private likeModel: Model<ILikeStatus>;

    constructor() {
        this.likeModel = LikeModel;
    }

    public async createLike(commentId: string, userId: string, likeStatus: string): Promise<ILikeStatus> {
        return this.likeModel.create({userId, likeStatus, commentId})
    }

    public async updateLikeStatus(id: RefType, likeStatus: string): Promise<ILikeStatus | null> {
        return this.likeModel.findOneAndUpdate({_id: id}, {"likeStatus": likeStatus})
    }

    public async findLike(userId: string, commentId: string): Promise<ILikeStatus | null> {
        return this.likeModel.findOne({$and:[{userId}, {commentId}]})
    }

    public async findLikeById(id: RefType): Promise<ILikeStatus | null> {
        return this.likeModel.findById(id)
    }

    public async countingLikeOrDislike(commentId: string, param: string) {
        return this.likeModel.find({$and: [{"commentId": commentId}, {"likeStatus": param}]}).count()
    }

    public async deleteAll() {
        return this.likeModel.deleteMany();
    }
}