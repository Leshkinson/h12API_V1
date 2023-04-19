import mongoose from "mongoose";
import {LikesStatusCfgValues} from "./types";

export interface IBlog {
    _id: mongoose.Schema.Types.ObjectId;
    name: string;
    description: string;
    websiteUrl: string;
}

export interface IPost {
    _id: mongoose.Schema.Types.ObjectId;
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
    extendedLikesInfo: extendedLikesInfo
}

export interface IUser {
    _id: mongoose.Schema.Types.ObjectId;
    login: string;
    email: string;
    password: string;
    isConfirmed: boolean;
    code: string;
    expirationDate: Date;
}

export interface IComment {
    _id: mongoose.Schema.Types.ObjectId;
    content: string;
    commentatorInfo: {
        userId: string,
        userLogin: string,
    }
    likesInfo: LikeInfo,

}

export interface IDevice {
    _id: mongoose.Schema.Types.ObjectId;
    ip: string,
    title: string,
    lastActiveDate: string,
    deviceId: string,
    userId: string,
}

export interface UserInvitation {
    to: string,
    html: string
}

export interface ILikeStatus {
    _id: mongoose.Schema.Types.ObjectId;
    likeStatus: LikesStatusCfgValues;
    userId: string,
    createdAt: Date
}

export interface LikeInfo {
    likesCount: number,
    dislikesCount: number,
    myStatus: string
}

export interface extendedLikesInfo extends LikeInfo {
    newestLikes: [
        {
            addedAt: Date,
            userId: string,
            login: string
        }
    ]
}
