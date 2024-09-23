"use client";

import { api } from "../convex/_generated/api";
import "../styles/globals.css";

import { useQuery } from "convex/react";

import { useState } from "react";
import Link from "next/link";
import { gameTitle } from "../common";

export function SearchBar() {
  const [searchInput, setSearchInput] = useState("");

  const handleChange = (e: any) => {
    e.preventDefault();
    setSearchInput(e.target.value);
  };

  const searchResults = useQuery(
    api.search.default,
    searchInput === ""
      ? "skip"
      : {
          query: searchInput,
        }
  ) || { users: [], games: [] };
  return (
    <div style={{ position: "absolute", top: "0", left: "0" }}>
      <div className="convexImage">
        <a href="/">
          <img src="/convex.svg"></img>
        </a>
        <div>
          <input
            type="text"
            placeholder="Search here"
            onChange={handleChange}
            value={searchInput}
          />
        </div>
        <table>
          <tbody>
            {searchResults.users.map((result) => (
              <tr key={result._id}>
                <td>
                  {
                    <Link href={`/user/${result._id}`}>
                      {(result as any).name}
                    </Link>
                  }
                </td>
              </tr>
            ))}
            {searchResults.games.map((result) => (
              <tr key={result._id}>
                <td>
                  <Link
                    href={`/play/${result._id}?moveIndex=${
                      result.moveIndex ?? ""
                    }`}
                  >
                    {gameTitle(result)}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
