"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

type Ingredient =
  | string
  | {
      name: string;
      quantity?: string;
    };

type FavoriteRecipe = {
  id: string;
  recipe_name: string;
  ingredients: Ingredient[];
  recipe: string | null;
};

export default function FavoritePage() {
  const router = useRouter();

  const [recipes, setRecipes] = useState<FavoriteRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadFavorites = async () => {
      const supabase = getSupabaseClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("favorite")
        .select("id, recipe_name, ingredients, recipe")
        .eq("user_id", user.id);

      if (!isMounted) return;

      if (fetchError) {
        setError("お気に入りレシピを取得できませんでした。");
      } else {
        setRecipes((data ?? []) as FavoriteRecipe[]);
      }

      setIsLoading(false);
    };

    loadFavorites();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleRemoveFavorite = async (recipe: FavoriteRecipe) => {
    setError(null);
    setRemovingId(recipe.id);

    const supabase = getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("ログイン状態を確認できませんでした。");
      setRemovingId(null);
      return;
    }

    const { error: deleteError } = await supabase
      .from("favorite")
      .delete()
      .eq("id", recipe.id)
      .eq("user_id", user.id);

    if (deleteError) {
      setError("お気に入りの解除に失敗しました。");
      setRemovingId(null);
      return;
    }

    setRecipes((current) => current.filter((item) => item.id !== recipe.id));

    if (selectedRecipeId === recipe.id) {
      setSelectedRecipeId(null);
    }

    setRemovingId(null);
  };

  const formatIngredient = (ingredient: Ingredient) => {
    if (typeof ingredient === "string") {
      return ingredient;
    }

    return [ingredient.name, ingredient.quantity].filter(Boolean).join(" ");
  };

  return (
    <main className="min-h-screen bg-[#f7f4ef] px-5 py-8 text-[#3d3935] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-2 text-sm text-[#817a72] transition-colors hover:text-[#5f7668]"
        >
          <span aria-hidden="true">←</span>
          トップページへ戻る
        </Link>

        <section className="rounded-2xl border border-[#e8e2d9] bg-[#fcfbf8] p-7 shadow-[0_14px_40px_rgba(89,78,64,0.06)] sm:p-10">
          <p className="mb-3 text-xs tracking-[0.22em] text-[#8e9a8d]">
            MY FAVORITES
          </p>

          <h1 className="font-serif text-3xl font-medium tracking-[0.08em] text-[#504b45] sm:text-4xl">
            お気に入り
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#8a837b]">
            また作りたいレシピをここにまとめています。
          </p>

          {isLoading ? (
            <p className="mt-10 text-sm text-[#8a837b]">
              お気に入りレシピを読み込んでいます…
            </p>
          ) : (
            <div className="mt-10">
              <div className="mb-5 flex items-center justify-between border-b border-[#ebe5dd] pb-5">
                <div>
                  <p className="text-xs tracking-[0.16em] text-[#9b948c]">
                    SAVED RECIPES
                  </p>
                  <h2 className="mt-1 text-xl font-medium text-[#504b45]">
                    お気に入りレシピ
                  </h2>
                </div>

                <span className="text-sm text-[#8e9a8d]">
                  {recipes.length}件
                </span>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mb-5 rounded-xl bg-[#fff3ef] px-4 py-3 text-sm text-[#b86656]"
                >
                  {error}
                </p>
              )}

              {recipes.length === 0 ? (
                <p className="rounded-xl bg-[#f7f5f0] px-4 py-10 text-center text-sm leading-7 text-[#948d84]">
                  お気に入りレシピはまだありません。
                  <br />
                  気になるレシピをハートで登録してみましょう。
                </p>
              ) : (
                <div className="space-y-3">
                  {recipes.map((recipe) => {
                    const isSelected = selectedRecipeId === recipe.id;

                    return (
                      <article
                        key={recipe.id}
                        className="rounded-xl border border-[#e8e2d9] bg-white p-4"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedRecipeId(isSelected ? null : recipe.id)
                            }
                            aria-expanded={isSelected}
                            className="min-w-0 flex-1 text-left"
                          >
                            <h3 className="font-medium text-[#504b45]">
                              {recipe.recipe_name}
                            </h3>

                            <p className="mt-2 text-xs leading-6 text-[#8a837b]">
                              材料：
                              {recipe.ingredients
                                .map(formatIngredient)
                                .join("・")}
                            </p>

                            <span className="mt-2 inline-block text-xs text-[#8e9a8d]">
                              {isSelected
                                ? "詳細を閉じる −"
                                : "作り方を見る ＋"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveFavorite(recipe)}
                            disabled={removingId === recipe.id}
                            aria-label={`${recipe.recipe_name}のお気に入りを解除`}
                            className="shrink-0 rounded-full p-2 text-[#c77d7d] transition-colors hover:bg-[#fbf1ee] disabled:opacity-50"
                          >
                            <Heart size={20} fill="currentColor" />
                          </button>
                        </div>

                        {isSelected && (
                          <div className="mt-5 border-t border-[#ebe5dd] pt-5">
                            <h4 className="mb-3 text-sm font-medium text-[#5d6960]">
                              材料・分量
                            </h4>

                            <ul className="space-y-2">
                              {recipe.ingredients.map((item, index) => (
                                <li
                                  key={index}
                                  className="text-sm text-[#716b64]"
                                >
                                  {formatIngredient(item)}
                                </li>
                              ))}
                            </ul>

                            <h4 className="mb-3 mt-6 text-sm font-medium text-[#5d6960]">
                              作り方
                            </h4>

                            <p className="whitespace-pre-wrap text-sm leading-7 text-[#716b64]">
                              {recipe.recipe || "作り方の情報はありません。"}
                            </p>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
