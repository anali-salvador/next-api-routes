"use client";

import { Suspense } from "react";
import AuthorDetail, { AuthorDetailSkeleton } from "@/components/AuthorDetail";

// useParams necesita un Suspense con cacheComponents en rutas con parámetros dinámicos
export default function AuthorPage() {
  return (
    <Suspense fallback={<AuthorDetailSkeleton />}>
      <AuthorDetail />
    </Suspense>
  );
}
