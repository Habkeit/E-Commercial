//app/foods/[id]/SearchBox.tsx
"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

interface SearchBoxProps {
  initialQuery?: string;
  placeholder?: string;
}

export default function SearchBox({
  initialQuery = "",
  placeholder = "Search for restaurants...",
}: SearchBoxProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 500);

  return (
    <div className="relative w-full max-w-md mb-8">
      <label htmlFor="search" className="sr-only">
        Search
      </label>

      <div className="group relative flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="absolute left-3.5 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-rose-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>

        <input
          id="search"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-gray-800 font-medium placeholder:text-gray-400 placeholder:font-normal shadow-sm outline-none transition-all hover:border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
          placeholder={placeholder}
          defaultValue={initialQuery || searchParams.get("query")?.toString()}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
    </div>
  );
}
