-- CreateEnum
CREATE TYPE "Region" AS ENUM ('AHAFO', 'ASHANTI', 'BONO_EAST', 'CENTRAL', 'EASTERN', 'GREATER_ACCRA', 'NORTH_EAST', 'NORTHERN', 'OTI', 'SAVANNAH', 'UPPER_EAST', 'UPPER_WEST', 'VOLTER', 'WESTERN', 'WESTERN_NORTH');

-- CreateEnum
CREATE TYPE "MeasureType" AS ENUM ('DEFAULT_TYPE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(100) NOT NULL,
    "email_address" VARCHAR(255) NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "region" "Region" NOT NULL,
    "image_path" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(255) NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" VARCHAR(255) NOT NULL,
    "refresh_token" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(100) NOT NULL,
    "address" VARCHAR(100) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloth_images" (
    "id" VARCHAR(255) NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "customer_id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cloth_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_details" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "customer_id" VARCHAR(255) NOT NULL,
    "female_measurement_id" VARCHAR(255) NOT NULL,
    "male_measurement_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dress_collections" (
    "id" VARCHAR(255) NOT NULL,
    "customer_id" VARCHAR(255) NOT NULL,
    "amount" INTEGER NOT NULL,
    "collect_date" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "is_collected" BOOLEAN NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dress_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "male_measurements" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "value" INTEGER NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "measure_type" "MeasureType" NOT NULL DEFAULT 'DEFAULT_TYPE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "male_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "female_measurements" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "customer_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "measure_type" "MeasureType" NOT NULL DEFAULT 'DEFAULT_TYPE',
    "status" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "female_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_address_key" ON "users"("email_address");

-- CreateIndex
CREATE UNIQUE INDEX "users_company_name_key" ON "users"("company_name");

-- CreateIndex
CREATE UNIQUE INDEX "otp_code_key" ON "otp"("code");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_refresh_token_key" ON "refresh_token"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_number_key" ON "customers"("phone_number");

-- AddForeignKey
ALTER TABLE "otp" ADD CONSTRAINT "otp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloth_images" ADD CONSTRAINT "cloth_images_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloth_images" ADD CONSTRAINT "cloth_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_details" ADD CONSTRAINT "customer_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_details" ADD CONSTRAINT "customer_details_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_details" ADD CONSTRAINT "customer_details_female_measurement_id_fkey" FOREIGN KEY ("female_measurement_id") REFERENCES "female_measurements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_details" ADD CONSTRAINT "customer_details_male_measurement_id_fkey" FOREIGN KEY ("male_measurement_id") REFERENCES "male_measurements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dress_collections" ADD CONSTRAINT "dress_collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dress_collections" ADD CONSTRAINT "dress_collections_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "male_measurements" ADD CONSTRAINT "male_measurements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "female_measurements" ADD CONSTRAINT "female_measurements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
