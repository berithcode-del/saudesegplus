-- CreateEnum
CREATE TYPE "PerfilTour" AS ENUM ('EMPRESA', 'CLINICA', 'MEDICO');

-- CreateTable
CREATE TABLE "Tutorial" (
    "id" TEXT NOT NULL,
    "perfil" "PerfilTour" NOT NULL,
    "titulo" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "faq" JSONB NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tutorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorialProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "perfil" "PerfilTour" NOT NULL,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorialProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TutorialProgress_userId_perfil_key" ON "TutorialProgress"("userId", "perfil");
