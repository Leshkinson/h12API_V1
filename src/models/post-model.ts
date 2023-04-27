import {IPost} from "../ts/interfaces";
import mongoose, {Schema} from "mongoose";

export const PostSchema = new Schema({
    title: {type: "string", required: true},
    shortDescription: {type: "string", required: true},
    content: {type: "string", required: true},
    blogId: {type: "string", required: true},
    blogName: {type: "string", required: true},
    extendedLikesInfo: {
        likesCount: {type: "number", default: 0},
        dislikesCount: {type: "number", default: 0},
        myStatus: {type: "string", default: "None"},
        newestLikes: [
            {
                addedAt: {type: "Date"},
                userId: {type: "string", default: null},
                login: {type: "string", default: null}
            }
        ]
    }
}, {timestamps: true});

PostSchema.set('toJSON', {
    transform: function (doc, dto) {
        dto.id = dto._id;
        delete dto._id;
        delete dto.__v;
        delete dto.updatedAt;
        // dto.newestLikes = dto.newestLikes.map((el: any) => {
        //     delete el._id;
        //     return el;
        // })
        dto.extendedLikesInfo.newestLikes = dto.extendedLikesInfo.newestLikes.map((el: any) => {
            delete el._id;
            return el;
        })
    }
})

export const PostModel = mongoose.model<IPost>('Post', PostSchema)