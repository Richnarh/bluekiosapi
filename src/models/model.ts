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
    emailAddress:string, 
    password:string
}