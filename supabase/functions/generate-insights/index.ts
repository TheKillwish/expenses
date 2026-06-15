import {
  createClient
}
from "https://esm.sh/@supabase/supabase-js@2";
import {
  benchmarks
}
from "./benchmarks.ts";

const corsHeaders = {

  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

  "Access-Control-Allow-Methods":
    "POST, OPTIONS"

};

Deno.serve(
  async req => {

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

        throw new Error(
          "Missing Authorization header"
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

        error

      } =
        await supabase.auth
          .getUser();

      if (
        error ||
        !user
      ) {

        throw new Error(
          "User not authenticated"
        );

      }

      const {
        data: profile,
        error: profileError
      } =
        await supabase
          .from(
            "user_profiles"
          )
          .select(`
            monthly_income,
            created_at
          `)
          .eq(
            "user_id",
            user.id
          )
          .single();

      if (
        profileError ||
        !profile
      ) {

        throw new Error(
          "User profile not found"
        );

      }

      const {
        data: expenses,
        error: expensesError
      } =
        await supabase
          .from(
            "expenses"
          )
          .select(`
            id,
            amount,
            category_id,
            description,
            expense_date
          `)
          .eq(
            "user_id",
            user.id
          );

      if (
        expensesError
      ) {

        throw new Error(
          expensesError.message
        );

      }

      const {
        data: categories,
        error: categoriesError
      } =
        await supabase
          .from(
            "categories"
          )
          .select(`
            id,
            name,
            monthly_budget
          `)
          .eq(
            "user_id",
            user.id
          );

      if (
        categoriesError
      ) {

        throw new Error(
          categoriesError.message
        );

      }

      const expenseCount =
        expenses?.length ?? 0;

      const accountAgeDays =

        Math.max(

          1,

          Math.floor(

            (

              new Date()
                .getTime()

              -

              new Date(
                profile.created_at
              ).getTime()

            )

            /

            (
              1000 *
              60 *
              60 *
              24
            )

          )

        );
        let budgetTier:
  'low' |
  'medium' |
  'high' =
  'medium';
      const eligible =

        expenseCount >= 10 &&

        accountAgeDays >= 6;

      const spentThisMonth =

        expenses?.reduce(

          (
            total,
            expense
          ) =>

            total +
            Number(
              expense.amount
            ),

          0

        ) ?? 0;

      const highestExpense =

        Math.max(

          ...(expenses ?? [])
            .map(

              expense =>

                Number(
                  expense.amount
                )

            ),

          0

        );

        const monthlyBudget =

  categories?.reduce(

    (
      total,
      category
    ) =>

      total +

      Number(

        category.monthly_budget ?? 0

      ),

    0

  ) ?? 0;
  const monthlyIncome =
  Number(
    profile.monthly_income
  );

if (
  monthlyIncome < 30000
) {

  budgetTier =
    'low';

}
else if (
  monthlyIncome > 100000
) {

  budgetTier =
    'high';

}
  const plannedSavings =

  Math.max(

    monthlyIncome -

    monthlyBudget,

    0

  );

const actualSavings =

  Math.max(

    monthlyIncome -

    spentThisMonth,

    0

  );

const savingsDifference =

  actualSavings -

  plannedSavings;

      const averageDailySpend =

        Number(

          (

            spentThisMonth /

            accountAgeDays

          )
          .toFixed(2)

        );

      const budgetUtilization =

        profile.monthly_income > 0

          ? Number(

              (

                monthlyBudget > 0

                ? Number(

                    (

                      spentThisMonth *

                      100 /

                      monthlyBudget

                    )
                    .toFixed(2)

                  )

                : 0

              )
              .toFixed(2)

            )

          : 0;

          const incomeUtilization =

  monthlyIncome > 0

    ? Number(

        (

          spentThisMonth *

          100 /

          monthlyIncome

        )
        .toFixed(2)

      )

    : 0;
        const fixedCategories = [

  'Rent',

  'Utilities',

  'EMI',

  'Mortgage',

  'Insurance'

];

      const categoryTotals:
        Record<
          string,
          number
        > = {};

      for (
        const expense of
        expenses ?? []
      ) {

        const category =
          categories?.find(

            category =>

              category.id ===
              expense.category_id

          );

        if (
          !category
        ) {

          continue;

        }

        categoryTotals[
          category.name
        ] =

          (
            categoryTotals[
              category.name
            ] ?? 0
          )

          +

          Number(
            expense.amount
          );

      }

      let topVariableCategory =
  '';

let topVariableSpend =
  0;

 for (

  const [

    category,

    amount

  ]

  of

  Object.entries(
    categoryTotals
  )

) {

  if (

    fixedCategories.includes(
      category
    )

  ) {

    continue;

  }

  if (

    amount >

    topVariableSpend

  ) {

    topVariableCategory =
      category;

    topVariableSpend =
      amount;

  }

}


      const categoryPercentages:
        Record<
          string,
          number
        > = {};

      for (

        const [

          category,

          amount

        ]

        of

        Object.entries(
          categoryTotals
        )

      ) {

        categoryPercentages[
          category
        ] =

          Number(

            (

              amount *

              100 /

              Math.max(
                spentThisMonth,
                1
              )

            )
            .toFixed(2)

          );

      }
      

let fixedExpenses =
  0;

let variableExpenses =
  0;

for (

  const [

    category,

    amount

  ]

  of

  Object.entries(
    categoryTotals
  )

) {

  if (

    fixedCategories.includes(
      category
    )

  ) {

    fixedExpenses +=
      amount;

  }

  else {

    variableExpenses +=
      amount;

  }

}


const estimatedSavings =

  Math.max(

    monthlyIncome -

    spentThisMonth,

    0

  );
const peerBenchmark =

  benchmarks[
    budgetTier
  ];
  const savingsRate =

  monthlyIncome > 0

    ? Number(

        (

          estimatedSavings *

          100 /

          monthlyIncome

        )
        .toFixed(2)

      )

    : 0;

  const aiMetrics = {

  monthly_income:
    monthlyIncome,

  monthly_budget:
    monthlyBudget,

  spent_this_month:
    spentThisMonth,

  budget_utilization:
    budgetUtilization,

  income_utilization:
    incomeUtilization,

  planned_savings:
    plannedSavings,

  actual_savings:
    actualSavings,

  savings_difference:
    savingsDifference,

  fixed_expenses:
    fixedExpenses,

  variable_expenses:
    variableExpenses,

  top_variable_category:
    topVariableCategory,

  top_variable_spend:
    topVariableSpend

};
const prompt = `

You are Rezu AI, an expert personal finance coach.

Analyze the following financial metrics:

${JSON.stringify(
  aiMetrics
)}

Important Context:

Fixed expenses include:

- Rent
- Utilities
- EMI
- Mortgage
- Insurance

Do NOT focus on fixed expenses unless they exceed 60% of monthly income.

Prioritize insights related to:

- Food
- Travel
- Shopping
- Entertainment
- Subscriptions
- Variable spending habits

Your insight MUST reference actual numbers and percentages from the provided metrics.

Return JSON only:

{
  "title":"",
  "summary":"",
  "action":"",
  "severity":"low|medium|high"
}

Rules:

1. Generate exactly ONE insight.
2. Mention actual rupee values whenever possible.
3. Mention percentages whenever possible.
4. Mention estimated monthly savings if there is an opportunity.
5. If spending habits are healthy, provide a positive reinforcement insight.
6. If savings_rate > 40%, prefer highlighting good financial discipline.
7. Keep summary under 50 words.
8. Keep action under 30 words.
9. Avoid generic financial advice.
10. Every insight must include at least one specific number.
11. Every action must be measurable.
12. Return JSON only.

Examples:

Good:

"Food spending is ₹4,315 (11.7% of total spending), compared to 8% for users with similar income."

"Your savings rate is 63%, leaving an estimated ₹63,224 available for savings or investments this month."

Bad:

"You spend a lot on food."

"Try saving more money."

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

      body: JSON.stringify({

        model:
          "llama-3.1-8b-instant",

        temperature: 0.2,

        response_format: {

          type:
            "json_object"

        },

        messages: [

          {

            role:
              "system",

            content:
              "You are a personal finance coach."

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
  const today =

  new Date()
    .toISOString()
    .split('T')[0];

const {
  data: existingInsight
} =
  await supabase
    .from(
      'ai_insights'
    )
    .select(
      'id'
    )
    .eq(
      'user_id',
      user.id
    )
    .gte(
      'created_at',
      `${today}T00:00:00`
    )
    .maybeSingle();

if (
  existingInsight
) {

  return new Response(

    JSON.stringify({

      success: true,

      alreadyGenerated:
        true

    }),

    {

      headers: {

        ...corsHeaders,

        'Content-Type':
          'application/json'

      }

    }

  );

}
  const groqData =
  await groqResponse.json();

const aiInsight =

  JSON.parse(

    groqData
      .choices[0]
      .message
      .content

  );
  const {
  error: insertError
} =
  await supabase
    .from(
      'ai_insights'
    )
    .insert({

      user_id:
        user.id,

      title:
        aiInsight.title,

      summary:
        aiInsight.summary,

      action:
        aiInsight.action,

      severity:
        aiInsight.severity,

      metrics:
        aiMetrics

    });
    

if (
  insertError
) {

  console.error(
    'AI INSIGHT SAVE ERROR:',
    insertError
  );

}

      return new Response(

  JSON.stringify({

    success: true,

    eligible,
    
    categoryTotal:categoryTotals,

    insight:
      aiInsight,

    metrics:
      aiMetrics

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

      return new Response(

        JSON.stringify({

          success: false,

          error:
            error.message

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