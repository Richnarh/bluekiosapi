import prisma from "@/config/prisma";

export class DefaultService{
    public static getUser = async (id: string) => await prisma.user.findUnique({ where: { id } });
    public static getCompany = async (userId:string) => await prisma.company.findFirst({ where: { userId } })
}