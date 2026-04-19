-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'ADMINISTRATOR', 'MOBILE_USER');

-- CreateEnum
CREATE TYPE "AccountLifecycle" AS ENUM ('ACTIVE', 'PENDING_DELETION', 'DELETED');

-- CreateEnum
CREATE TYPE "LegalDocumentKind" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('BASIC', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('DIRECT', 'GROUP', 'SUPPORT');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('NEW', 'IN_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ReportSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('NEW', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ContentModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('CONSULTATION', 'THERAPY', 'GROUP_SESSION', 'TRAINING', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'CLICK', 'PAYME', 'CASH', 'TRANSFER');

-- CreateEnum
CREATE TYPE "CenterPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'REFUND', 'COMMISSION', 'SUBSCRIPTION', 'PAYOUT');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('SESSION', 'MOBILE_PREMIUM', 'CENTER_SUBSCRIPTION', 'OTHER');

-- CreateEnum
CREATE TYPE "ConsumerSubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingPaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUNDED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "blocked_at" TIMESTAMP(3),
    "blocked_reason" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "account_lifecycle" "AccountLifecycle" NOT NULL DEFAULT 'ACTIVE',
    "deletion_requested_at" TIMESTAMP(3),
    "scheduled_deletion_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "center_id" INTEGER,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "device_info" TEXT,
    "ip_address" TEXT,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "phone" TEXT,
    "email" TEXT,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "superadmins" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "superadmins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_centers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "description" TEXT,
    "logo_url" TEXT,
    "subscription_plan" "SubscriptionPlan" NOT NULL DEFAULT 'BASIC',
    "center_tariff_plan_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrators" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "center_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "position" TEXT,
    "invited_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "administrators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_users" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "avatar_url" TEXT,
    "date_of_birth" DATE,
    "gender" TEXT,
    "bio" TEXT,
    "pin_hash" TEXT,
    "biometric_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "premium_until" TIMESTAMP(3),
    "consumer_plan_id" INTEGER,
    "onboarding_completed_at" TIMESTAMP(3),
    "notification_prefs" JSONB,
    "analytics_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "accepted_terms_version" TEXT,
    "accepted_privacy_version" TEXT,
    "terms_accepted_at" TIMESTAMP(3),
    "privacy_accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "psychologists" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "center_id" INTEGER,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "patronymic" TEXT,
    "gender" TEXT,
    "date_of_birth" DATE,
    "specialization" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "license_number" TEXT,
    "education" TEXT,
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience_years" INTEGER,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "rejection_reason" TEXT,
    "hourly_rate" INTEGER,
    "rating" DOUBLE PRECISION,
    "total_sessions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "psychologists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" SERIAL NOT NULL,
    "center_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "subject" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" SERIAL NOT NULL,
    "center_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "position" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "role_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "center_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "date_of_birth" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "center_id" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "code" TEXT,
    "duration_weeks" INTEGER,
    "name" TEXT NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" SERIAL NOT NULL,
    "center_id" INTEGER NOT NULL,
    "course_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "max_students" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "course_id" INTEGER,
    "group_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "type" TEXT NOT NULL DEFAULT 'psychological',
    "duration" INTEGER,
    "image_url" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "test_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'single_choice',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" SERIAL NOT NULL,
    "test_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "score" INTEGER,
    "max_score" INTEGER,
    "responses" JSONB,
    "interpretation" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" SERIAL NOT NULL,
    "type" "ChatType" NOT NULL DEFAULT 'DIRECT',
    "title" TEXT,
    "image_url" TEXT,
    "created_by" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_participants" (
    "id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "last_read_at" TIMESTAMP(3),

    CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "content" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "attachment_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "type" TEXT NOT NULL DEFAULT 'general',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "target_audience" TEXT NOT NULL DEFAULT 'all',
    "center_id" INTEGER,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_posts" (
    "id" SERIAL NOT NULL,
    "author_id" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_post_likes" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" INTEGER,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" SERIAL NOT NULL,
    "reporter_id" INTEGER NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'NEW',
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "assigned_to_user_id" INTEGER,
    "resolution_note" TEXT,
    "resolved_by" INTEGER,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "center_id" INTEGER,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_reports" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "severity" "ReportSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "ReportStatus" NOT NULL DEFAULT 'NEW',
    "created_by_user_id" INTEGER NOT NULL,
    "assigned_to_user_id" INTEGER,
    "resolution_note" TEXT,
    "resolved_by" INTEGER,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "center_id" INTEGER,

    CONSTRAINT "moderation_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_history" (
    "id" SERIAL NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "performed_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "block_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_moderation" (
    "id" SERIAL NOT NULL,
    "content_type" TEXT NOT NULL,
    "content_id" INTEGER NOT NULL,
    "content_title" TEXT,
    "status" "ContentModerationStatus" NOT NULL DEFAULT 'PENDING',
    "moderator_id" INTEGER,
    "moderator_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_moderation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" SERIAL NOT NULL,
    "moderator_id" INTEGER NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "complaint_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "cover_image_url" TEXT,
    "category" TEXT,
    "tags" TEXT[],
    "author_id" INTEGER,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "link_url" TEXT,
    "position" TEXT NOT NULL DEFAULT 'home',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_content" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "duration" INTEGER,
    "category" TEXT,
    "tags" TEXT[],
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audio_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_content" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "duration" INTEGER,
    "category" TEXT,
    "tags" TEXT[],
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affirmations" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projective_methods" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "image_url" TEXT,
    "category" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projective_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainings" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "category" TEXT,
    "duration" INTEGER,
    "image_url" TEXT,
    "video_url" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'beginner',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "MeetingType" NOT NULL DEFAULT 'CONSULTATION',
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "host_id" INTEGER NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "meeting_url" TEXT,
    "open_broadcast" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_participants" (
    "id" SERIAL NOT NULL,
    "meeting_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "joined_at" TIMESTAMP(3),
    "left_at" TIMESTAMP(3),

    CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "center_payments" (
    "id" SERIAL NOT NULL,
    "center_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "enrollment_id" INTEGER,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "status" "CenterPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "payment_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "center_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "psychologist_id" INTEGER,
    "session_id" INTEGER,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethod" NOT NULL DEFAULT 'CARD',
    "provider" TEXT,
    "provider_payment_id" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "kind" "PaymentKind" NOT NULL DEFAULT 'SESSION',
    "platform_fee_percent" INTEGER,
    "platform_fee_amount" INTEGER,
    "net_amount" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "center_id" INTEGER,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "payment_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "psychologist_id" INTEGER,
    "administrator_id" INTEGER,
    "type" "TransactionType" NOT NULL DEFAULT 'PAYMENT',
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "method" "PaymentMethod",
    "description" TEXT,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "center_id" INTEGER,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_records" (
    "id" SERIAL NOT NULL,
    "center_id" INTEGER,
    "source" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "period" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_monetization_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "default_commission_percent" INTEGER NOT NULL DEFAULT 10,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_monetization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "center_tariff_plans" (
    "id" SERIAL NOT NULL,
    "tier" "SubscriptionPlan" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "max_users" INTEGER,
    "max_psychologists" INTEGER,
    "feature_flags" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "center_tariff_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumer_plans" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthly_price_uzs" INTEGER NOT NULL DEFAULT 0,
    "feature_psych_chat" BOOLEAN NOT NULL DEFAULT false,
    "feature_video_consultation" BOOLEAN NOT NULL DEFAULT false,
    "feature_courses" BOOLEAN NOT NULL DEFAULT false,
    "feature_premium_content" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "consumer_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumer_subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "consumer_plan_id" INTEGER NOT NULL,
    "status" "ConsumerSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "payment_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consumer_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" INTEGER,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "center_id" INTEGER,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "event" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_app_settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'all',
    "description" TEXT,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" SERIAL NOT NULL,
    "kind" "LegalDocumentKind" NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crisis_resources" (
    "id" SERIAL NOT NULL,
    "region_code" TEXT NOT NULL DEFAULT 'GLOBAL',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL,
    "phone_number" TEXT,
    "help_text" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crisis_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "permissions" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_settings" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "psychologist_id" INTEGER NOT NULL,
    "administrator_id" INTEGER,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "price" INTEGER NOT NULL DEFAULT 0,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "BookingPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "meeting_id" INTEGER,
    "chat_id" INTEGER,
    "notes" TEXT,
    "cancel_reason" TEXT,
    "cancelled_by" INTEGER,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_entries" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mood" INTEGER NOT NULL,
    "note" TEXT,
    "factors" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diary_entries" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "mood" INTEGER,
    "tags" TEXT[],
    "is_private" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "target_count" INTEGER NOT NULL DEFAULT 1,
    "color" TEXT,
    "icon" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_logs" (
    "id" SERIAL NOT NULL,
    "habit_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sleep_records" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "sleep_start" TIMESTAMP(3) NOT NULL,
    "sleep_end" TIMESTAMP(3),
    "quality" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sleep_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breathing_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "technique" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breathing_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_items" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sos_alerts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sos_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breathing_scenarios" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "inhale_sec" INTEGER NOT NULL DEFAULT 4,
    "hold_sec" INTEGER NOT NULL DEFAULT 4,
    "exhale_sec" INTEGER NOT NULL DEFAULT 4,
    "cycles_default" INTEGER NOT NULL DEFAULT 4,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breathing_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_psychologist_conversations" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_psychologist_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_psychologist_messages" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_psychologist_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_push_devices" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expo_push_token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "device_label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_push_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "target_id" INTEGER NOT NULL,
    "targetType" TEXT NOT NULL DEFAULT 'PSYCHOLOGIST',
    "user_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_center_id_key" ON "roles"("name", "center_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_role_id_resource_action_key" ON "permissions"("role_id", "resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "superadmins_user_id_key" ON "superadmins"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "administrators_user_id_key" ON "administrators"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mobile_users_user_id_key" ON "mobile_users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "psychologists_user_id_key" ON "psychologists"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_center_id_code_key" ON "courses"("center_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "chat_participants_chat_id_user_id_key" ON "chat_participants"("chat_id", "user_id");

-- CreateIndex
CREATE INDEX "community_post_likes_user_id_created_at_idx" ON "community_post_likes"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "community_post_likes_post_id_user_id_key" ON "community_post_likes"("post_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_participants_meeting_id_user_id_key" ON "meeting_participants"("meeting_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "center_tariff_plans_tier_key" ON "center_tariff_plans"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "consumer_plans_code_key" ON "consumer_plans"("code");

-- CreateIndex
CREATE INDEX "consumer_subscriptions_user_id_status_idx" ON "consumer_subscriptions"("user_id", "status");

-- CreateIndex
CREATE INDEX "security_logs_user_id_created_at_idx" ON "security_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "security_logs_event_created_at_idx" ON "security_logs"("event", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "mobile_app_settings_key_key" ON "mobile_app_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_kind_version_key" ON "legal_documents"("kind", "version");

-- CreateIndex
CREATE INDEX "crisis_resources_region_code_is_active_idx" ON "crisis_resources"("region_code", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "saved_items_user_id_item_type_item_id_key" ON "saved_items"("user_id", "item_type", "item_id");

-- CreateIndex
CREATE INDEX "sos_alerts_user_id_created_at_idx" ON "sos_alerts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_psychologist_conversations_user_id_idx" ON "ai_psychologist_conversations"("user_id");

-- CreateIndex
CREATE INDEX "ai_psychologist_messages_conversation_id_created_at_idx" ON "ai_psychologist_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "mobile_push_devices_user_id_idx" ON "mobile_push_devices"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mobile_push_devices_user_id_expo_push_token_key" ON "mobile_push_devices"("user_id", "expo_push_token");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "education_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "superadmins" ADD CONSTRAINT "superadmins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_centers" ADD CONSTRAINT "education_centers_center_tariff_plan_id_fkey" FOREIGN KEY ("center_tariff_plan_id") REFERENCES "center_tariff_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrators" ADD CONSTRAINT "administrators_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "education_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrators" ADD CONSTRAINT "administrators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_users" ADD CONSTRAINT "mobile_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_users" ADD CONSTRAINT "mobile_users_consumer_plan_id_fkey" FOREIGN KEY ("consumer_plan_id") REFERENCES "consumer_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "psychologists" ADD CONSTRAINT "psychologists_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "education_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "psychologists" ADD CONSTRAINT "psychologists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "education_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "education_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "education_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "education_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "education_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post_likes" ADD CONSTRAINT "community_post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post_likes" ADD CONSTRAINT "community_post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "education_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "education_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "block_history" ADD CONSTRAINT "block_history_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_moderation" ADD CONSTRAINT "content_moderation_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_payments" ADD CONSTRAINT "center_payments_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "education_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_payments" ADD CONSTRAINT "center_payments_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_payments" ADD CONSTRAINT "center_payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "education_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "education_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumer_subscriptions" ADD CONSTRAINT "consumer_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumer_subscriptions" ADD CONSTRAINT "consumer_subscriptions_consumer_plan_id_fkey" FOREIGN KEY ("consumer_plan_id") REFERENCES "consumer_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumer_subscriptions" ADD CONSTRAINT "consumer_subscriptions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "education_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_sessions" ADD CONSTRAINT "booking_sessions_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_sessions" ADD CONSTRAINT "booking_sessions_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_sessions" ADD CONSTRAINT "booking_sessions_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_sessions" ADD CONSTRAINT "booking_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sleep_records" ADD CONSTRAINT "sleep_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breathing_sessions" ADD CONSTRAINT "breathing_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_psychologist_conversations" ADD CONSTRAINT "ai_psychologist_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_psychologist_messages" ADD CONSTRAINT "ai_psychologist_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_psychologist_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_push_devices" ADD CONSTRAINT "mobile_push_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
