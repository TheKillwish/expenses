import {
  createClient
}
from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {

  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

  "Access-Control-Allow-Methods":
    "POST, OPTIONS"

};
const today =
  new Date()
    .toISOString()
    .split('T')[0];

Deno.serve(
  async (req) => {

    if (
      req.method ===
      "OPTIONS"
    ) {

      return new Response(
        "ok",
        {
          headers:
            corsHeaders
        }
      );

    }

    try {

      const authHeader =
        req.headers.get(
          "Authorization"
        );

      if (
        !authHeader
      ) {

        return new Response(

          JSON.stringify({

            success:
              false,

            error:
              "Missing Authorization header"

          }),

          {

            status: 401,

            headers: {

              ...corsHeaders,

              "Content-Type":
                "application/json"

            }

          }

        );

      }

      const supabase =
        createClient(

          Deno.env.get(
            "SUPABASE_URL"
          )!,

          Deno.env.get(
            "SUPABASE_ANON_KEY"
          )!,

          {

            global: {

              headers: {

                Authorization:
                  authHeader

              }

            }

          }

        );

      const {

        data: {
          user
        },

        error:
          userError

      } =
        await supabase
          .auth
          .getUser();

      if (
        userError ||
        !user
      ) {

        return new Response(

          JSON.stringify({

            success:
              false,

            error:
              "User not authenticated"

          }),

          {

            status: 401,

            headers: {

              ...corsHeaders,

              "Content-Type":
                "application/json"

            }

          }

        );

      }

      const {
        text
      } =
        await req.json();

      const {
        data: categories
      } =
        await supabase
          .from(
            "categories"
          )
          .select(
            `
            id,
            name,
            icon
          `
          )
          .eq(
            "user_id",
            user.id
          );

      const {
        data: subcategories
      } =
        await supabase
          .from(
            "subcategories"
          )
          .select(
            `
            id,
            name,
            category_id
          `
          )
          .eq(
            "user_id",
            user.id
          );

      const categoryMap:
  Record<string, string[]> = {};

for (
  const category of
  categories ?? []
) {

  categoryMap[
    category.name
  ] = [];

}

for (
  const subcategory of
  subcategories ?? []
) {

  const parentCategory =
    categories?.find(

      (      category: { id: any; }) =>

        category.id ===
        subcategory.category_id

    );

  if (
    parentCategory
  ) {

    categoryMap[
      parentCategory.name
    ].push(
      subcategory.name
    );

  }

}

const categoryContext =
  JSON.stringify(
    categoryMap
  );

const prompt = `

Expense Categories:

${categoryContext}

Current Date:

${today}

Expense Text:

"${text}"

Return JSON:

{
  "success": boolean,
  "amount": number|null,
  "category": string|null,
  "subcategory": string|null,
  "description": string|null,
  "date": string|null
}

Rules:

- Use only provided categories and subcategories
- OCR text may contain spelling mistakes
- Infer category from context and keywords
- Medical, hospital, clinic, pharmacy, doctor, medicine => Medical
- Fuel, petrol, diesel => Travel
- Restaurant, cafe, food delivery => Food
- Rent, landlord => Rent
- Electricity, water, internet, recharge => Utilities
- Description should be merchant or expense name
- Date format YYYY-MM-DD
- If date missing use current date
- success=true ONLY if a real expense can be confidently identified
- amount must exist in the text and must not be guessed
- if amount is missing return success=false
- if merchant/service/purchase cannot be identified return success=false
- do not infer an expense from random OCR text
- when in doubt return success=false
- Return JSON only
`;

      const groqResponse =
        await fetch(

          "https://api.groq.com/openai/v1/chat/completions",

          {

            method: "POST",

            headers: {

              Authorization:
                `Bearer ${Deno.env.get(
                  "GROQ_API_KEY"
                )}`,

              "Content-Type":
                "application/json"

            },

            body:
              JSON.stringify({

                model:
                  "llama-3.1-8b-instant",

                temperature:
                  0,

                response_format: {

                  type:
                    "json_object"

                },

                messages: [

                  {

                    role:
                      "system",

                    content:
                      "You are an expense parser. Always return valid JSON."

                  },

                  {

                    role:
                      "user",

                    content:
                      prompt

                  }

                ]

              })

          }

        );

      const groqData =
        await groqResponse
          .json();

      console.log(
        "GROQ RESPONSE:",
        groqData
      );

      if (
        !groqResponse.ok
      ) {

        throw new Error(

          JSON.stringify(
            groqData
          )

        );

      }

      const response =

        groqData
          ?.choices?.[0]
          ?.message
          ?.content;

      console.log(
        "RAW RESPONSE:",
        response
      );

      const parsed =
        JSON.parse(
          response
        );

      return new Response(

        JSON.stringify({
          context:categoryContext,
          prompt:prompt,


          success:
            true,

          ...parsed

        }),

        {

          headers: {

            ...corsHeaders,

            "Content-Type":
              "application/json"

          }

        }

      );

    }

    catch (
      error: any
    ) {

      console.error(
        "PARSE EXPENSE ERROR:",
        error
      );

      return new Response(

        JSON.stringify({

          success:
            false,

          error:
            error?.message ??
            String(error)

        }),

        {

          status: 500,

          headers: {

            ...corsHeaders,

            "Content-Type":
              "application/json"

          }

        }

      );

    }

  }
);