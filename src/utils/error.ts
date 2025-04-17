import { HttpResponse } from "@nhttp/nhttp";

export const error = (response: HttpResponse) => (message: string, code = 400) =>
    response.status(code).json({ message });
