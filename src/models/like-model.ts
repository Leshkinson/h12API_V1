import mongoose, {Schema} from "mongoose";
import {ILikeStatus} from "../ts/interfaces";

export const LikeSchema = new Schema({
    likeStatus: {type: "string", required: true},
    userId: {type: mongoose.Types.ObjectId, ref: 'User'},
    //userId: {type: "string", required: true},
    //commentId: {type: mongoose.Types.ObjectId, ref: 'Comment'},
    commentOrPostId: {type: "string", required: true},
}, {timestamps: true});

LikeSchema.set('toJSON', {
    transform: function (doc, dto) {
        dto.id = dto._id;
        delete dto._id;
        delete dto.__v;
        delete dto.updatedAt;
    }
});

LikeSchema.set('id', true);

export const LikeModel = mongoose.model<ILikeStatus>('LikeStatus', LikeSchema)