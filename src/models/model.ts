interface Base{
    id:string
    createdAt:Date;
    updatedAt:Date;
}

export interface LoginResponse extends Base{
    fullName:string;
    profileImage:string;
    phoneNumber:string;
    emailAddress:string;
    token:string;
    refreshToken:string;
}

export interface LoginRequest {
    username:string, 
    password:string
}

export enum FormType {
    MALE_FORM = "MALE_FORM",
    FEMALE_FORM = "FEMALE_FORM"
}