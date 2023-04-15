import {BlogService} from "../services/blog-service";
import {UserService} from "../services/user-service";
import {body, validationResult, CustomValidator} from 'express-validator';
//import {LikesStatusType} from "../ts/types";
import {LikesStatus} from "../const/const";

export const myValidationResult = validationResult.withDefaults({
    formatter: error => {
        return {
            message: error.msg,
            field: error.param
        };
    },
});

const isWebsiteUrlPattern: CustomValidator = (value: string) => {
    const patternURL = new RegExp(/^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/);
    if (!patternURL.test(value)) {
        throw new Error()
    }

    return true;
};

const isBodyIdPattern: CustomValidator = async (value: string) => {
    const blogService = new BlogService()
    const blog = await blogService.getOne(value);
    if (!blog) {
        throw new Error()
    }

    return true;
};

const isLoginPattern: CustomValidator = (value: string) => {
    const patternLogin = new RegExp(/^[a-zA-Z0-9_-]*$/);
    if (!patternLogin.test(value)) {
        throw new Error()
    }

    return true;
}

const isEmailPattern: CustomValidator = (value: string) => {
    const patternEmail = new RegExp(/^[\w-]+@([\w-]+\.)+[\w-]{2,4}$/);
    if (!patternEmail.test(value)) {
        throw new Error()
    }

    return true;
}

const isExistByParam: CustomValidator = async (value: string) => {
    const userService = new UserService()
    const user = await userService.getUserByParam(value)
    if (user) {
        throw new Error()
    }

    return true;
}

const isNotExistByParamAndConfirm: CustomValidator= async (value: string) => {
    const userService = new UserService();
    const user = await userService.getUserByParam(value)
    if (!user) {
        throw new Error()
    }

    return true;
}

const isConfirmedEmail: CustomValidator = async (value: string) => {
    const userService = new UserService()
    const user = await userService.getUserByParam(value)
    if (user?.isConfirmed) {
        throw new Error()
    }

    return true;
}

const isLikeStatusCheck: CustomValidator = (value: string) => {
    if(!Object.values(LikesStatus).some((item) => item === value)) {
        throw new Error()
    }

    return true;
}

export const nameValidation = body('name')
    .trim()
    .isLength({max: 15})
    .withMessage("Name has incorrect length. (Name has more than 15 characters)")
    .notEmpty()
    .withMessage("Name has incorrect length. (Name is empty)")
    .isString()
    .withMessage("Name has incorrect value. (Name isn't string)");

export const descriptionValidation = body('description')
    .trim()
    .isLength({max: 500})
    .withMessage("Name has incorrect length. (Description has more than 500 characters)")
    .notEmpty()
    .withMessage("Name has incorrect length. (Name is empty)")
    .isString()
    .withMessage("Name has incorrect value. (Name isn't string)");

export const websiteUrlValidation = body('websiteUrl')
    .trim()
    .isLength({max: 100})
    .withMessage("YoutubeUrl has incorrect length. (YoutubeUrl has more than 100 characters)")
    .isString()
    .withMessage("YoutubeUrl has incorrect value. (YoutubeUrl is empty)")
    .custom(isWebsiteUrlPattern)
    .withMessage("YoutubeUrl has incorrect value. (YoutubeUrl doesn't match pattern)");

export const titleValidation = body('title')
    .trim()
    .isLength({max: 30})
    .withMessage("Title has incorrect length. (Title has more than 30 characters)")
    .notEmpty()
    .withMessage("Title has incorrect length. (Title is empty)")
    .isString()
    .withMessage("Title has incorrect value. (Title isn't string)");

export const shortDescriptionValidation = body('shortDescription')
    .trim()
    .isLength({max: 100})
    .withMessage("ShortDescription has incorrect length. (ShortDescription has more than 100 characters)")
    .notEmpty()
    .withMessage("ShortDescription has incorrect length. (ShortDescription is empty)")
    .isString()
    .withMessage("ShortDescription has incorrect value. (ShortDescription isn't string)");

export const contentDescriptionValidation = body('content')
    .trim()
    .isLength({max: 1000})
    .withMessage("Content has incorrect length. (Content has more than 1000 characters)")
    .notEmpty()
    .withMessage("Content has incorrect length. (Content is empty)")
    .isString()
    .withMessage("Content has incorrect value. (Content isn't string)");

export const blogIdValidation = body('blogId')
    .trim()
    .isString()
    .withMessage("BlogId has incorrect value. (BlogId doesn't string)")
    .custom(isBodyIdPattern)
    .withMessage("BlogId has incorrect value. (BlogId not found)");

export const loginValidation = body('login')
    .trim()
    .isString()
    .withMessage("Login has incorrect value. (Login doesn't string)")
    .isLength({min: 3, max: 10})
    .withMessage("Login has incorrect value. (Content has less than 3 or more than 10 characters)")
    .custom(isLoginPattern)
    .withMessage("Login has incorrect value. (Login doesn't match pattern)")
    .custom(isExistByParam)
    .withMessage("Login is exist. (This login already exists enter another login)");

export const passwordValidation = body('password')
    .trim()
    .isString()
    .withMessage("Password has incorrect value. (Password doesn't string)")
    .isLength({min: 6, max: 20})
    .withMessage("Password has incorrect value. (Content has less than 6 or more than 20 characters)")

export const newPasswordValidation = body('newPassword')
    .trim()
    .isString()
    .withMessage("Password has incorrect value. (Password doesn't string)")
    .isLength({min: 6, max: 20})
    .withMessage("Password has incorrect value. (Content has less than 6 or more than 20 characters)")

export const emailValidation = body('email')
    .trim()
    .isString()
    .withMessage("Email has incorrect value. (Email doesn't string)")
    .custom(isEmailPattern)
    .withMessage("Email has incorrect value. (Email doesn't match pattern)")
    .custom(isExistByParam)
    .withMessage("Email is exist. (This email already exists enter another email)")
    .custom(isConfirmedEmail)
    .withMessage("Email is confirmed. (This email already confirmed)")


export const emailExistValidation = body('email')
    .trim()
    .isString()
    .withMessage("Email has incorrect value. (Email doesn't string)")
    .custom(isEmailPattern)
    .withMessage("Email has incorrect value. (Email doesn't match pattern)")
    .custom(isNotExistByParamAndConfirm)
    .withMessage("Email is not exist. (This email not exists enter another email)")
    .custom(isNotExistByParamAndConfirm)
    .withMessage("Email is confirmed. (This email already confirmed)")

export const emailValidationByPassword = body('email')
    .trim()
    .isString()
    .withMessage("Email has incorrect value. (Email doesn't string)")
    .custom(isEmailPattern)
    .withMessage("Email has incorrect value. (Email doesn't match pattern)")
    .custom(isNotExistByParamAndConfirm)
    .withMessage("Email is not exist. (This email not exists enter another email)")

export const emailValidationByNewPassword = body('email')
    .trim()
    .isString()
    .withMessage("Email has incorrect value. (Email doesn't string)")
    .custom(isEmailPattern)
    .withMessage("Email has incorrect value. (Email doesn't match pattern)")

export const contentValidation = body('content')
    .trim()
    .isString()
    .withMessage("Content has incorrect value. (BlogId doesn't string)")
    .isLength({min: 20, max: 300})
    .withMessage("Content has incorrect value. (Content has less than 20 or more than 300 characters)")

export const codeConfirmed = body('code')
    .trim()
    .isString()
    .withMessage("Code has incorrect value. (Email doesn't string)")
    .custom(isNotExistByParamAndConfirm)
    .withMessage("Code is confirmed. (This code already confirmed)")
    .custom(isNotExistByParamAndConfirm)
    .withMessage("Code is not exist. (This Code not exists)")

export const recoveryCodeConfirmed = body('recoveryCode')
    .trim()
    .isString()
    .withMessage("Code has incorrect value. (Email doesn't string)")
    .custom(isNotExistByParamAndConfirm)
    .withMessage("Code is not exist. (This Code not exists)")

export const likeStatusValidation = body('likeStatus')
    .trim()
    .isString()
    .withMessage("LikeStatus has incorrect value. (LikeStatus doesn't string)")
    .custom(isLikeStatusCheck)
    .withMessage("LikeStatus does not match type. (LikeStatus have wrong type)")



export const blogValidation = [nameValidation, descriptionValidation, websiteUrlValidation];
export const postValidationWithoutBodyId = [titleValidation, shortDescriptionValidation, contentDescriptionValidation];
export const postValidation = [titleValidation, shortDescriptionValidation, contentDescriptionValidation, blogIdValidation];
export const userValidation = [loginValidation, passwordValidation, emailValidation]
export const commentValidation = [contentValidation]
