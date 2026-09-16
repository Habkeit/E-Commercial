// app/foods/SearchBox.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function SearchBox({
  initialQuery,
  placeholder,
}: {
  initialQuery: string;
  placeholder: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [text, setText] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (text) {
        params.set("query", text);
      } else {
        params.delete("query");
      }
      
      router.push(`${pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [text, pathname, router, searchParams]);

  return (
    <div className="mb-8 max-w-md relative">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg pl-4 pr-10 py-2.5 focus:ring-2 focus:ring-rose-500 outline-none text-gray-800 placeholder-gray-400 bg-white shadow-sm transition-all"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        🔍
      </span>
    </div>
  );
}