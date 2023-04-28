import {SortOrder} from "mongoose";

export type PostsRequest = {
    pageNumber?: number | undefined,
    pageSize?: number | undefined,
    sortBy?: string | undefined,
    sortDirection?: SortOrder
}

export type BlogsRequestWithoutSNT = {
    pageNumber?: number | undefined,
    pageSize?: number | undefined,
    sizePage?: string | undefined,
    sortBy?: string | undefined,
    sortDirection?: SortOrder
}

export type CommentsRequest = {
    pageNumber?: number | undefined,
    pageSize?: number | undefined,
    sortBy?: string | undefined,
    sortDirection?: SortOrder
}

export type BlogsRequest = {
    pageNumber?: number | undefined,
    pageSize?: number | undefined,
    sortBy?: string | undefined,
    searchNameTerm?: string | undefined,
    sortDirection?: SortOrder
}

export type UsersRequest = {
    sortBy?: string | undefined,
    sortDirection?: SortOrder,
    pageNumber?: number | undefined,
    pageSize?: number | undefined,
    searchLoginTerm?: string | undefined,
    searchEmailTerm?: string | undefined,
}

export type LikesStatusType = {
    LIKE: "Like",
    DISLIKE: "Dislike",
    NONE: "None"
}

const LikesStatus_CFG = {
    LIKE: "Like",
    DISLIKE: "Dislike",
    NONE: "None"
} as const;

type LikesStatusCfgKeys = keyof typeof LikesStatus_CFG
export type LikesStatusCfgValues = typeof LikesStatus_CFG[LikesStatusCfgKeys]
