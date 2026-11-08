export type SearchField = "title" | "desc" | "copyright" | "date" | "ssd";
export interface DateRange { start: string; end: string }
export interface SearchClause {
  excludes: string[];
  fields: Array<{ field: SearchField; value: string; dateRange?: DateRange | null }>;
  phrase: string;
}
export type SearchExpression =
  | { kind: "clause"; clause: SearchClause }
  | { kind: "and" | "or"; children: SearchExpression[] }
  | { kind: "not"; child: SearchExpression };

export function normalizeSearchValue(value?: string) {
  return value?.normalize("NFKC").trim().toLowerCase() ?? "";
}

function dateBound(value: string, end: boolean): string | null {
  const match = value.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/)
    ?? value.match(/^(\d{4})(\d{2})?(\d{2})?$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) : end ? 12 : 1;
  if (!year || month < 1 || month > 12) return null;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  const day = match[3] ? Number(match[3]) : end ? days : 1;
  if (day < 1 || day > days) return null;
  return `${match[1]}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
}

function parseDateRange(value: string): DateRange | null | undefined {
  if (!value.includes("..") && !/^[\d-]+$/.test(value)) return undefined;
  const parts = value.split("..");
  if (parts.length > 2 || parts.every((part) => !part)) return null;
  const start = parts.length === 2 && !parts[0] ? "00010101" : dateBound(parts[0], false);
  const end = parts.length === 2 && !parts[1] ? "99991231" : dateBound(parts.at(-1)!, true);
  return start && end && start <= end ? { start, end } : null;
}

function parseClause(terms: string[]): SearchClause {
  const clause: SearchClause = { excludes: [], fields: [], phrase: "" };
  const plain: string[] = [];
  const unquote = (value: string) => normalizeSearchValue(value.replace(/^"|"$/g, ""));
  for (const term of terms) {
    if (term.startsWith("-") && term.length > 1) {
      clause.excludes.push(unquote(term.slice(1)));
      continue;
    }
    const match = term.match(/^(title|desc|description|copyright|date|ssd):(.+)$/i);
    if (match) {
      const field = (match[1].toLowerCase() === "description" ? "desc" : match[1].toLowerCase()) as SearchField;
      const value = unquote(match[2]);
      if (value) clause.fields.push({ field, value, ...(field === "date" ? { dateRange: parseDateRange(value) } : {}) });
    } else {
      plain.push(unquote(term));
    }
  }
  clause.phrase = plain.join(" ").trim();
  return clause;
}

type Token = { kind: "term" | "and" | "or" | "not" | "(" | ")"; value: string };

// Quotes keep commas, parentheses and operator words inside field values literal.
function tokenize(query: string): Token[] | null {
  const tokens: Token[] = [];
  for (let index = 0; index < query.length;) {
    if (/\s/.test(query[index])) { index++; continue; }
    const character = query[index];
    if (character === "," || character === "(" || character === ")") {
      tokens.push({ kind: character === "," ? "or" : character, value: character });
      index++;
    } else {
      const start = index;
      let quoted = false;
      while (index < query.length) {
        const current = query[index];
        if (current === '"') quoted = !quoted;
        else if (!quoted && /[\s,()]/.test(current)) break;
        index++;
      }
      if (quoted) return null;
      let value = query.slice(start, index);
      if (/^(title|desc|description|copyright|date|ssd):$/i.test(value)) {
        while (index < query.length && /\s/.test(query[index])) index++;
        const valueStart = index;
        while (index < query.length) {
          const current = query[index];
          if (current === '"') quoted = !quoted;
          else if (!quoted && /[\s,()]/.test(current)) break;
          index++;
        }
        if (quoted || valueStart === index) return null;
        value += query.slice(valueStart, index);
      }
      const kind = value === "AND" ? "and" : value === "OR" ? "or" : value === "NOT" ? "not" : "term";
      tokens.push({ kind, value });
    }
    if (tokens.length > 256) return null;
  }
  return tokens;
}

// AND (including adjacent fields/groups) binds more tightly than OR or commas.
// Plain adjacent words remain one phrase for compatibility with existing search.
export function parseSearchQuery(query?: string): SearchExpression | null {
  const tokens = tokenize(query?.normalize("NFKC").trim() ?? "");
  if (!tokens?.length) return null;
  let position = 0;
  function atom(depth: number, singleTerm = false): SearchExpression | null {
    if (depth > 32) return null;
    const token = tokens![position];
    if (!token) return null;
    if (token.kind === "not") {
      position++;
      const child = atom(depth + 1, true);
      return child ? { kind: "not", child } : null;
    }
    if (token.kind === "(") {
      position++;
      const group = expression(depth + 1);
      if (!group || tokens![position]?.kind !== ")") return null;
      position++;
      return group;
    }
    if (token.kind !== "term") return null;
    const terms: string[] = [];
    do {
      terms.push(tokens![position++].value);
    } while (!singleTerm && tokens![position]?.kind === "term");
    return { kind: "clause", clause: parseClause(terms) };
  }
  function conjunction(depth: number): SearchExpression | null {
    const first = atom(depth);
    if (!first) return null;
    const children = [first];
    while (position < tokens!.length && !["or", ")"].includes(tokens![position].kind)) {
      if (tokens![position].kind === "and") position++;
      const next = atom(depth);
      if (!next) return null;
      children.push(next);
    }
    return children.length === 1 ? first : { kind: "and", children };
  }
  function expression(depth: number): SearchExpression | null {
    const first = conjunction(depth);
    if (!first) return null;
    const children = [first];
    while (tokens![position]?.kind === "or") {
      position++;
      const next = conjunction(depth);
      if (!next) return null;
      children.push(next);
    }
    return children.length === 1 ? first : { kind: "or", children };
  }
  const result = expression(0);
  return position === tokens.length ? result : null;
}

export function positiveSearchClauses(expression: SearchExpression, negated = false): SearchClause[] {
  if (expression.kind === "clause") return negated ? [] : [expression.clause];
  if (expression.kind === "not") return positiveSearchClauses(expression.child, !negated);
  return expression.children.flatMap((child) => positiveSearchClauses(child, negated));
}
