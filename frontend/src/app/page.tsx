"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

interface Recipe {
  id: number;
  title: string;
  cuisine: string;
  difficulty: string;
  cookTime: number;
  servings: number;
  image: string;
  rating: number;
  ingredients: string[];
  description: string;
}

interface FetchRecipesResponse {
  recipes: Recipe[];
  totalCount: number;
}

interface Cuisine {
  id: number;
  name: string;
}

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [allCuisines, setAllCuisines] = useState<Cuisine[]>([]);

  const recipesPerPage = 6;

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(currentPage));
      params.append("limit", String(recipesPerPage));

      if (searchTerm) {
        params.append("title", searchTerm);
      }
      if (selectedCuisine) {
        params.append("cuisine", selectedCuisine);
      }

      const response = await fetch(
        `http://localhost:3001/api/recipes?${params.toString()}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Error fetching recipes: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (typeof data.totalCount === "number" && Array.isArray(data.recipes)) {
        setRecipes(data.recipes);
        setTotalPages(Math.ceil(data.totalCount / recipesPerPage));
      } else if (Array.isArray(data)) {
        console.warn(
          "CRITICAL: Backend did not return 'totalCount'. Pagination will be guesswork and likely incorrect. Please update your backend to return 'totalCount' along with the recipes array (e.g., { recipes: [...], totalCount: ... })."
        );
        setRecipes(data);
        const itemsReturnedOnPage = data.length;

        if (itemsReturnedOnPage === 0) {
          if (currentPage === 1) {
            setTotalPages(0);
          } else {
            setTotalPages(currentPage - 1);
          }
        } else if (itemsReturnedOnPage < recipesPerPage) {
          setTotalPages(currentPage);
        } else {
          setTotalPages(currentPage + 1);
        }
      } else {
        console.error("Unexpected data format from backend:", data);
        setRecipes([]);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
      setRecipes([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCuisine, recipesPerPage]);

  useEffect(() => {
    const fetchAllCuisines = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/cuisine");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();

        setAllCuisines(data);
      } catch (error) {
        console.error("Error fetching cuisines:", error);
        setAllCuisines([]);
      }
    };
    fetchAllCuisines();
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const showIngredientsModal = (recipe: Recipe) => {
    Swal.fire({
      title: `<strong>${recipe.title}</strong>`,
      html: `
      <div style="
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      ">
        <p style="text-align: center; font-weight: bold; margin-bottom: 0.5rem;">
          Ingredients:
        </p>
        <ul style="text-align: left; margin: 0 auto; max-width: 300px; padding-left: 1rem;">
          ${recipe.ingredients
            .map((ingredient) => `<li>${ingredient}</li>`)
            .join("")}
        </ul>
      </div>
    `,
      icon: "info",
      confirmButtonText: "Close",
      customClass: {
        popup: "rounded-lg p-6",
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Recipe Collection
          </h1>
          <p className="text-gray-600 mt-2">
            Discover and share amazing recipes from around the world
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search recipes by title..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedCuisine("");
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCuisine}
            onChange={(e) => {
              setSelectedCuisine(e.target.value);
              setSearchTerm("");
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">All Cuisines</option>
            {allCuisines.map((cuisine) => (
              <option key={cuisine.id} value={cuisine.id}>
                {cuisine.name}
              </option>
            ))}
          </select>
        </div>

        {recipes.length === 0 && (
          <div className="text-center my-8 text-gray-500">
            <p className="text-xl">No recipes found.</p>
            <p>Try adjusting your search terms or filters.</p>
          </div>
        )}

        {recipes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {recipes.map((recipe, index) => (
              <div
                key={recipe.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48">
                  <Image
                    src={recipe.image}
                    alt={recipe.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    priority={index < recipesPerPage / 2}
                  />
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                        recipe.difficulty
                      )}`}
                    >
                      {recipe.difficulty}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3
                    className="text-lg font-semibold text-gray-900 mb-2 truncate"
                    title={recipe.title}
                  >
                    {recipe.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 h-20 overflow-y-auto">
                    {recipe.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span className="flex items-center">
                      <span className="mr-1">🍽️</span>
                      {recipe.cuisine}
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">⏱️</span>
                      {recipe.cookTime} min
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">👥</span>
                      {recipe.servings}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-yellow-400 mr-1">⭐</span>
                      <span className="text-sm text-gray-600">
                        {recipe.rating}
                      </span>
                    </div>
                    <button
                      onClick={() => showIngredientsModal(recipe)}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 transition-colors duration-200 cursor-pointer"
                    >
                      View Recipe
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 0 && (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  disabled={loading} // Disabled while loading
                  className={`px-4 py-2 border rounded-lg ${
                    currentPage === pageNumber
                      ? "bg-orange-500 text-white border-orange-500" // Active page style
                      : "border-gray-300 hover:bg-gray-50 cursor-pointer"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {pageNumber}
                </button>
              )
            )}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
