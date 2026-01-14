"use client";

import type { Session } from "@supabase/supabase-js";
import {
  IconArrowRight,
  IconCheck,
  IconCirclePlus,
  IconEye,
  IconLogout,
  IconPlus,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

const adminAllowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

type Pack = {
  id: string;
  name: string;
  description: string;
  price_display: string | null;
  is_active: boolean;
};

type Answer = {
  id: string;
  answer_text: string;
  is_correct: boolean;
  question_id: string;
  isNew?: boolean;
};

type Question = {
  id: string;
  prompt: string;
  question_answers: Answer[];
};

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [packs, setPacks] = useState<Pack[]>([]);
  const [packsError, setPacksError] = useState("");
  const [isLoadingPacks, setIsLoadingPacks] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsError, setQuestionsError] = useState("");
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionStatus, setQuestionStatus] = useState("");
  const [newQuestionPrompt, setNewQuestionPrompt] = useState("");

  const [packName, setPackName] = useState("");
  const [packDescription, setPackDescription] = useState("");
  const [packPrice, setPackPrice] = useState("");
  const [packIsActive, setPackIsActive] = useState(true);
  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [createStatus, setCreateStatus] = useState("");
  const [createError, setCreateError] = useState("");

  const sessionEmail = session?.user.email?.toLowerCase() ?? "";
  const isAllowed = useMemo(() => {
    if (!adminAllowlist.length) return true;
    return adminAllowlist.includes(sessionEmail);
  }, [sessionEmail]);

  const selectedPack = useMemo(
    () => packs.find((pack) => pack.id === selectedPackId) ?? null,
    [packs, selectedPackId]
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (isMounted) {
          setSession(data.session ?? null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthError("Unable to read auth session.");
        }
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (isMounted) {
          setSession(nextSession);
        }
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadPacks = async () => {
    setIsLoadingPacks(true);
    setPacksError("");

    const { data, error } = await supabase
      .from("packs")
      .select("id, name, description, price_display, is_active")
      .order("created_at", { ascending: false });

    if (error) {
      setPacksError(error.message);
      setPacks([]);
      setSelectedPackId(null);
    } else {
      const nextPacks = data ?? [];
      setPacks(nextPacks);
      if (!selectedPackId && nextPacks.length > 0) {
        setSelectedPackId(nextPacks[0].id);
      }
    }

    setIsLoadingPacks(false);
  };

  const loadQuestions = async (packId: string) => {
    setIsLoadingQuestions(true);
    setQuestionsError("");

    const { data, error } = await supabase
      .from("questions")
      .select("id, prompt, question_answers(id, answer_text, is_correct, question_id)")
      .eq("pack_id", packId)
      .order("created_at", { ascending: false });

    if (error) {
      setQuestionsError(error.message);
      setQuestions([]);
    } else {
      const nextQuestions =
        data?.map((question) => ({
          ...question,
          question_answers: question.question_answers ?? [],
        })) ?? [];
      setQuestions(nextQuestions);
    }

    setIsLoadingQuestions(false);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !session || !isAllowed) return;
    loadPacks();
  }, [session, isAllowed]);

  useEffect(() => {
    if (!isSupabaseConfigured || !session || !isAllowed || !selectedPackId) {
      setQuestions([]);
      return;
    }
    loadQuestions(selectedPackId);
  }, [session, isAllowed, selectedPackId]);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    setAuthStatus("");

    if (!email.trim()) {
      setAuthError("Enter the email address you use for admin access.");
      return;
    }

    setIsSigningIn(true);
    const redirectTo =
      typeof window === "undefined" ? undefined : window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthStatus("Magic link sent. Check your inbox to continue.");
    }

    setIsSigningIn(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleCreatePack = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateStatus("");
    setCreateError("");

    if (!packName.trim() || !packDescription.trim()) {
      setCreateError("Name and description are required.");
      return;
    }

    setIsCreatingPack(true);
    const { error } = await supabase.from("packs").insert({
      name: packName.trim(),
      description: packDescription.trim(),
      price_display: packPrice.trim() ? packPrice.trim() : null,
      is_active: packIsActive,
    });

    if (error) {
      setCreateError(error.message);
    } else {
      setCreateStatus("Pack created.");
      setPackName("");
      setPackDescription("");
      setPackPrice("");
      setPackIsActive(true);
      await loadPacks();
    }

    setIsCreatingPack(false);
  };

  const handleCreateQuestion = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setQuestionStatus("");
    setQuestionsError("");

    if (!selectedPackId) return;
    if (!newQuestionPrompt.trim()) {
      setQuestionsError("Question prompt is required.");
      return;
    }

    const { data: createdQuestions, error } = await supabase
      .from("questions")
      .insert({
        pack_id: selectedPackId,
        prompt: newQuestionPrompt.trim(),
      })
      .select("id")
      .limit(1);

    if (error || !createdQuestions?.length) {
      setQuestionsError(error?.message ?? "Failed to create question.");
      return;
    }

    const questionId = createdQuestions[0].id;
    const seedAnswers = [
      ...Array.from({ length: 5 }, (_, index) => ({
        question_id: questionId,
        answer_text: `Correct ${index + 1}`,
        is_correct: true,
      })),
      ...Array.from({ length: 5 }, (_, index) => ({
        question_id: questionId,
        answer_text: `Wrong ${index + 1}`,
        is_correct: false,
      })),
    ];

    const { error: seedError } = await supabase
      .from("question_answers")
      .insert(seedAnswers);
    if (seedError) {
      setQuestionsError(seedError.message);
      return;
    }

    setNewQuestionPrompt("");
    setQuestionStatus("Question created with starter answers.");
    await loadQuestions(selectedPackId);
  };

  const updateQuestionPrompt = (questionId: string, value: string) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId ? { ...question, prompt: value } : question
      )
    );
  };

  const updateAnswerText = (
    questionId: string,
    answerId: string,
    value: string
  ) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;
        return {
          ...question,
          question_answers: question.question_answers.map((answer) =>
            answer.id === answerId ? { ...answer, answer_text: value } : answer
          ),
        };
      })
    );
  };

  const addAnswer = (questionId: string, isCorrect: boolean) => {
    const newAnswer: Answer = {
      id: `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      question_id: questionId,
      answer_text: "",
      is_correct: isCorrect,
      isNew: true,
    };
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? { ...question, question_answers: [...question.question_answers, newAnswer] }
          : question
      )
    );
  };

  const canRemoveAnswer = (question: Question, answer: Answer) => {
    const correctCount = question.question_answers.filter((item) => item.is_correct).length;
    const wrongCount = question.question_answers.filter((item) => !item.is_correct).length;
    if (answer.is_correct) {
      return correctCount > 5;
    }
    return wrongCount > 5;
  };

  const removeAnswer = async (question: Question, answer: Answer) => {
    setQuestionStatus("");
    setQuestionsError("");

    if (answer.isNew) {
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === question.id
            ? {
                ...item,
                question_answers: item.question_answers.filter(
                  (itemAnswer) => itemAnswer.id !== answer.id
                ),
              }
            : item
        )
      );
      return;
    }

    if (!canRemoveAnswer(question, answer)) {
      setQuestionsError("Keep at least 5 correct and 5 wrong answers.");
      return;
    }

    const { error } = await supabase
      .from("question_answers")
      .delete()
      .eq("id", answer.id);

    if (error) {
      setQuestionsError(error.message);
      return;
    }

    setQuestions((prev) =>
      prev.map((item) =>
        item.id === question.id
          ? {
              ...item,
              question_answers: item.question_answers.filter(
                (itemAnswer) => itemAnswer.id !== answer.id
              ),
            }
          : item
      )
    );
    setQuestionStatus("Answer removed.");
  };

  const saveQuestion = async (question: Question) => {
    setQuestionStatus("");
    setQuestionsError("");

    if (!question.prompt.trim()) {
      setQuestionsError("Question prompt cannot be empty.");
      return;
    }

    const { error: updateError } = await supabase
      .from("questions")
      .update({ prompt: question.prompt.trim() })
      .eq("id", question.id);

    if (updateError) {
      setQuestionsError(updateError.message);
      return;
    }

    const existingAnswers = question.question_answers.filter((answer) => !answer.isNew);
    const newAnswers = question.question_answers.filter((answer) => answer.isNew);

    if (existingAnswers.length) {
      const { error } = await supabase.from("question_answers").upsert(
        existingAnswers.map((answer) => ({
          id: answer.id,
          answer_text: answer.answer_text.trim(),
          is_correct: answer.is_correct,
        })),
        { onConflict: "id" }
      );

      if (error) {
        setQuestionsError(error.message);
        return;
      }
    }

    if (newAnswers.length) {
      const { error } = await supabase.from("question_answers").insert(
        newAnswers.map((answer) => ({
          question_id: question.id,
          answer_text: answer.answer_text.trim() || "Untitled answer",
          is_correct: answer.is_correct,
        }))
      );

      if (error) {
        setQuestionsError(error.message);
        return;
      }
    }

    setQuestionStatus("Question saved.");
    if (selectedPackId) {
      await loadQuestions(selectedPackId);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    setQuestionStatus("");
    setQuestionsError("");

    const { error } = await supabase.from("questions").delete().eq("id", questionId);
    if (error) {
      setQuestionsError(error.message);
      return;
    }
    setQuestions((prev) => prev.filter((question) => question.id !== questionId));
    setQuestionStatus("Question removed.");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--primary)/0.15,_transparent_55%),radial-gradient(circle_at_30%_30%,_var(--muted)_0%,_transparent_45%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-16 pt-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="outline" className="gap-1 text-[0.7rem]">
              <IconSparkles className="size-3" />
              {isSupabaseConfigured ? "Supabase ready" : "Supabase missing"}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Na Tahu Admin</h1>
            <p className="text-muted-foreground max-w-xl text-sm">
              Manage packs and questions with inline edits. Keep this dashboard private and let
              Supabase RLS do the heavy lifting.
            </p>
          </div>
          {session ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1 text-[0.7rem]">
                <IconEye className="size-3" />
                {session.user.email}
              </Badge>
              <Button variant="outline" size="default" onClick={handleSignOut}>
                <IconLogout className="size-3" />
                Sign out
              </Button>
            </div>
          ) : null}
        </header>

        {!isSupabaseConfigured ? (
          <Card>
            <CardHeader>
              <CardTitle>Missing environment variables</CardTitle>
              <CardDescription>
                Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                to <code>apps/admin/.env.local</code> to connect the dashboard.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : !session ? (
          <Card>
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>Send yourself a magic link to access the admin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form className="grid gap-3" onSubmit={handleSignIn}>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <Button type="submit" disabled={isSigningIn}>
                  {isSigningIn ? "Sending..." : "Send magic link"}
                </Button>
              </form>
              {authStatus ? <p className="text-xs text-muted-foreground">{authStatus}</p> : null}
              {authError ? <p className="text-xs text-destructive">{authError}</p> : null}
            </CardContent>
          </Card>
        ) : !isAllowed ? (
          <Card>
            <CardHeader>
              <CardTitle>Access blocked</CardTitle>
              <CardDescription>
                This account is not on the allowlist. Update <code>NEXT_PUBLIC_ADMIN_EMAILS</code>
                to include it.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" size="default" onClick={handleSignOut}>
                Switch account
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pack library</CardTitle>
                  <CardDescription>Select a pack to start editing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoadingPacks ? <p className="text-xs text-muted-foreground">Loading packs...</p> : null}
                  {packsError ? <p className="text-xs text-destructive">{packsError}</p> : null}
                  {packs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No packs found yet.</p>
                  ) : (
                    <div className="grid gap-2">
                      {packs.map((pack) => (
                        <button
                          key={pack.id}
                          type="button"
                          onClick={() => setSelectedPackId(pack.id)}
                          className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                            selectedPackId === pack.id
                              ? "border-primary/40 bg-primary/10"
                              : "border-border bg-card hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{pack.name}</span>
                            <Badge variant={pack.is_active ? "default" : "outline"}>
                              {pack.is_active ? "Active" : "Hidden"}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mt-1 line-clamp-2">
                            {pack.description}
                          </p>
                          {pack.price_display ? (
                            <p className="text-[0.65rem] text-muted-foreground mt-1">
                              {pack.price_display}
                            </p>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Create pack</CardTitle>
                  <CardDescription>Launch a new pack in minutes.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-3" onSubmit={handleCreatePack}>
                    <Input
                      type="text"
                      placeholder="Pack name"
                      value={packName}
                      onChange={(event) => setPackName(event.target.value)}
                      required
                    />
                    <Textarea
                      placeholder="Short description"
                      value={packDescription}
                      onChange={(event) => setPackDescription(event.target.value)}
                      required
                    />
                    <Input
                      type="text"
                      placeholder="Price label (optional)"
                      value={packPrice}
                      onChange={(event) => setPackPrice(event.target.value)}
                    />
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={packIsActive}
                        onChange={(event) => setPackIsActive(event.target.checked)}
                        className="accent-primary"
                      />
                      Active pack
                    </label>
                    <Button type="submit" disabled={isCreatingPack}>
                      <IconCirclePlus className="size-3" />
                      {isCreatingPack ? "Creating..." : "Create pack"}
                    </Button>
                  </form>
                  {createStatus ? (
                    <p className="text-xs text-muted-foreground mt-3">{createStatus}</p>
                  ) : null}
                  {createError ? (
                    <p className="text-xs text-destructive mt-3">{createError}</p>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Pack editor</CardTitle>
                <CardDescription>
                  Inline editing only. Save each question when you are done.
                </CardDescription>
                {selectedPack ? (
                  <CardAction>
                    <Badge variant="outline" className="gap-1">
                      <IconArrowRight className="size-3" />
                      {selectedPack.name}
                    </Badge>
                  </CardAction>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedPack ? (
                  <p className="text-xs text-muted-foreground">
                    Select a pack to start editing questions.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    <form className="grid gap-2" onSubmit={handleCreateQuestion}>
                      <Input
                        type="text"
                        placeholder="New question prompt"
                        value={newQuestionPrompt}
                        onChange={(event) => setNewQuestionPrompt(event.target.value)}
                        required
                      />
                      <Button type="submit" size="default">
                        <IconPlus className="size-3" />
                        Add question
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        New questions include 5 correct and 5 wrong starter answers.
                      </p>
                    </form>

                    {isLoadingQuestions ? (
                      <p className="text-xs text-muted-foreground">Loading questions...</p>
                    ) : null}
                    {questionsError ? (
                      <p className="text-xs text-destructive">{questionsError}</p>
                    ) : null}
                    {questionStatus ? (
                      <p className="text-xs text-muted-foreground">{questionStatus}</p>
                    ) : null}

                    {questions.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No questions yet. Add the first one.
                      </p>
                    ) : null}

                    <div className="grid gap-4">
                      {questions.map((question) => {
                        const correctAnswers = question.question_answers.filter(
                          (answer) => answer.is_correct
                        );
                        const wrongAnswers = question.question_answers.filter(
                          (answer) => !answer.is_correct
                        );

                        return (
                          <div key={question.id} className="rounded-xl border border-border/60 bg-muted/30 p-4">
                            <div className="grid gap-3">
                              <Input
                                value={question.prompt}
                                onChange={(event) =>
                                  updateQuestionPrompt(question.id, event.target.value)
                                }
                                placeholder="Question prompt"
                              />
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="default"
                                  variant="secondary"
                                  type="button"
                                  onClick={() => saveQuestion(question)}
                                >
                                  <IconCheck className="size-3" />
                                  Save question
                                </Button>
                                <Button
                                  size="default"
                                  variant="outline"
                                  type="button"
                                  onClick={() => deleteQuestion(question.id)}
                                >
                                  <IconTrash className="size-3" />
                                  Remove question
                                </Button>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge>Correct ({correctAnswers.length})</Badge>
                                  <Button
                                    variant="outline"
                                    size="default"
                                    type="button"
                                    onClick={() => addAnswer(question.id, true)}
                                  >
                                    + Add
                                  </Button>
                                </div>
                                <div className="grid gap-2">
                                  {correctAnswers.map((answer) => (
                                    <div key={answer.id} className="flex gap-2">
                                      <Input
                                        value={answer.answer_text}
                                        onChange={(event) =>
                                          updateAnswerText(
                                            question.id,
                                            answer.id,
                                            event.target.value
                                          )
                                        }
                                        placeholder="Correct answer"
                                      />
                                      <Button
                                        size="default"
                                        variant="outline"
                                        type="button"
                                        disabled={!canRemoveAnswer(question, answer)}
                                        onClick={() => removeAnswer(question, answer)}
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">Wrong ({wrongAnswers.length})</Badge>
                                  <Button
                                    variant="outline"
                                    size="default"
                                    type="button"
                                    onClick={() => addAnswer(question.id, false)}
                                  >
                                    + Add
                                  </Button>
                                </div>
                                <div className="grid gap-2">
                                  {wrongAnswers.map((answer) => (
                                    <div key={answer.id} className="flex gap-2">
                                      <Input
                                        value={answer.answer_text}
                                        onChange={(event) =>
                                          updateAnswerText(
                                            question.id,
                                            answer.id,
                                            event.target.value
                                          )
                                        }
                                        placeholder="Wrong answer"
                                      />
                                      <Button
                                        size="default"
                                        variant="outline"
                                        type="button"
                                        disabled={!canRemoveAnswer(question, answer)}
                                        onClick={() => removeAnswer(question, answer)}
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
