import prisma from "@/config/prisma";

export class Ds{
    public static getUser = async (id: string) => await prisma.user.findUnique({ where: { id } });
}