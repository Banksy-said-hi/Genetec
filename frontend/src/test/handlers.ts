import { http, HttpResponse } from 'msw';
import { apiBaseUrl } from '../api/client';

const authors = [
  { id: 1, name: 'J.R.R. Tolkien' },
  { id: 2, name: 'C.S. Lewis' },
  { id: 3, name: 'Ursula K. Le Guin' },
];

export const handlers = [
  http.get(`${apiBaseUrl}/authors`, ({ request }) => {
    const search = (new URL(request.url).searchParams.get('search') ?? '').toLowerCase();
    return HttpResponse.json(authors.filter((a) => a.name.toLowerCase().includes(search)));
  }),

  http.post(`${apiBaseUrl}/books`, async ({ request }) => {
    const body = (await request.json()) as {
      title: string;
      shortDescription: string;
      publishDate: string;
      authorNames: string[];
    };
    return HttpResponse.json(
      {
        id: 999,
        ...body,
        authors: body.authorNames.map((name, i) => ({ id: i + 1, name })),
      },
      { status: 201 },
    );
  }),
];
