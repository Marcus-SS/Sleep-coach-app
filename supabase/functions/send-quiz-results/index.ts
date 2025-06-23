// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs

// supabase/functions/send-quiz-results/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, chronotype, description, score } = await req.json()

    // Create detailed email content
    const getPersonalizedTips = (chronotypeType) => {
      const type = chronotypeType.toLowerCase()
      
      if (type.includes('morning') || type.includes('lark')) {
        return `
          <h3>💡 Your Personalized Sleep Tips:</h3>
          <ul>
            <li><strong>Bedtime:</strong> Aim for 9:00-10:00 PM to get your optimal 7-9 hours</li>
            <li><strong>Light exposure:</strong> Get bright light first thing in the morning</li>
            <li><strong>Avoid:</strong> Late-night screen time and caffeine after 2 PM</li>
            <li><strong>Exercise:</strong> Morning or early afternoon workouts work best for you</li>
          </ul>
        `
      } else if (type.includes('night') || type.includes('owl')) {
        return `
          <h3>💡 Your Personalized Sleep Tips:</h3>
          <ul>
            <li><strong>Bedtime:</strong> Don't force early bedtimes - 11 PM to 1 AM is natural for you</li>
            <li><strong>Morning routine:</strong> Use bright light therapy when you wake up</li>
            <li><strong>Work schedule:</strong> Try to negotiate later start times if possible</li>
            <li><strong>Weekend recovery:</strong> Allow yourself to sleep in on weekends</li>
          </ul>
        `
      } else if (type.includes('evening')) {
        return `
          <h3>💡 Your Personalized Sleep Tips:</h3>
          <ul>
            <li><strong>Bedtime:</strong> 10:30-11:30 PM works well for your type</li>
            <li><strong>Peak hours:</strong> Schedule important tasks for late afternoon/evening</li>
            <li><strong>Morning adjustment:</strong> Gradual light exposure can help with early mornings</li>
            <li><strong>Flexibility:</strong> You can adapt to different schedules with some effort</li>
          </ul>
        `
      } else {
        return `
          <h3>💡 Your Personalized Sleep Tips:</h3>
          <ul>
            <li><strong>Flexibility advantage:</strong> You can adapt to various schedules more easily</li>
            <li><strong>Consistency:</strong> Maintain regular sleep/wake times for best results</li>
            <li><strong>Listen to your body:</strong> Pay attention to natural energy peaks and dips</li>
            <li><strong>Gradual changes:</strong> You can shift your schedule when needed with patience</li>
          </ul>
        `
      }
    }

    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Chronotype Results</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #843484 0%, #47154f 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px; }
          .result-box { background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 5px solid #843484; }
          .cta-button { display: inline-block; background: #843484; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          ul { padding-left: 20px; }
          li { margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌙 Your Sleep Chronotype Results</h1>
          <p>Discover your natural sleep-wake cycle</p>
        </div>

        <div class="result-box">
          <h2>${chronotype}</h2>
          <p><strong>Your Score:</strong> ${score}/30</p>
          <p>${description}</p>
        </div>

        ${getPersonalizedTips(chronotype)}

        <h3>🚀 Want Even Deeper Insights?</h3>
        <p>This quick quiz is just the beginning! Our full sleep app includes:</p>
        <ul>
          <li>✅ Complete 19-question chronotype and insomnia assessment</li>
          <li>✅ Personalized sleep schedule recommendations</li>
          <li>✅ Daily sleep tracking and smart insights</li>
          <li>✅ Wake-up optimization based on your sleep cycles</li>
          <li>✅ Custom sleep environment recommendations</li>
          <li>✅ A personalized AI coach that takes any questions you have, and is always there to help you</li>

        </ul>

        <div style="text-align: center; margin: 30px 0;">
          <a href="YOUR_APP_STORE_LINK" class="cta-button">Download Sleep App - Free</a>
        </div>

        <div class="footer">
          <p><strong>Questions?</strong> Reply to this email - we'd love to help optimize your sleep!</p>
          <p>Sweet dreams,<br>The Sleep Team</p>
          <hr style="margin: 20px 0;">
          <p style="font-size: 12px;">You received this email because you completed our chronotype quiz. We won't spam you, but we might send occasional sleep tips. <a href="#">Unsubscribe</a></p>
        </div>
      </body>
      </html>
    `

    // Send email using Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Acme <onboarding@resend.dev>', // Change to your verified domain
        to: [email],
        subject: `Your Sleep Type: ${chronotype} 🌙`,
        html: emailContent,
      }),
    })

    const emailResult = await resendResponse.json()

    if (!resendResponse.ok) {
      throw new Error(`Email failed: ${emailResult.message || 'Unknown error'}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailId: emailResult.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (error) {
    console.error('Detailed error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        details: error.stack // Add this temporarily for debugging
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 // Change from 400 to 500 for server errors
      },
    )
  }
})



/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-quiz-results' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
