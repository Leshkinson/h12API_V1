import mongoose, {Schema} from "mongoose";
import {ILikeStatus} from "../ts/interfaces";

export const LikeSchemaForPost = new Schema({
    likeStatus: {type: "string", required: true},
    userId: {type: "string", required: true},
    postId: {type: mongoose.Types.ObjectId, ref: 'Post'}
}, {timestamps: true});

LikeSchemaForPost.set('toJSON', {
    transform: function (doc, dto) {
        dto.id = dto._id;
        delete dto._id;
        delete dto.__v;
        delete dto.updatedAt;
    }
});

LikeSchemaForPost.set('id', true);

export const LikeModelForPost = mongoose.model<ILikeStatus>('LikeStatusForPost', LikeSchemaForPost)