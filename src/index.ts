
export default {
	
	async fetch(request, env, ctx): Promise<Response> {
		try {
			let question: string = "";
			if (request.method === 'POST') {
				const body = await request.json() as { q: string };
				question = body.q;
			} else if (request.method === 'GET') {
				const url = new URL(request.url);
				question = url.searchParams.get('q') || '';
			} else {
				return new Response('forbidden', { 
					status: 405,
					headers: { 'Access-Control-Allow-Origin': '*' }
				});
			}
			let res_success = false;
			let res_result = ""
			// param
			if (!question || question.trim().length === 0) {
				res_success = false
				res_result = "missing param q"
			} else {
				// call ai
				const result = await ai_api(question);
				const success = result["success"]
				if (success) {
					res_success = true
					res_result = result["result"]
				} else {
					res_success = false
					res_result = result["result"]
				}
			}
			const res = {
				success: res_success,
				result: res_result
			}
			return new Response(JSON.stringify(res), {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		} catch (error) {
			return new Response(JSON.stringify({
				success: false,
				result: error instanceof Error ? error.message : 'Unknown error occurred'
			}), {
				status: 500,
				headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
				}
			});
		}
	},

} satisfies ExportedHandler<Env>;


//ai api
async function ai_api(question: string): Promise<{
  success: boolean;
  result: any;
}> {
	const apiKey = "sk-1ce9c74459c1448ab6ff5d633884c333"
  const requestBody = {
    model: 'deepseek-chat',
    messages: [
      {
        role: 'user',
        content: question
      }
    ],
    stream: false
  };

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        result: errorText
      };
    }
    const responseData = await response.json() as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };
    const content = responseData.choices?.[0]?.message?.content;
    if (content) {
      return {
        success: true,
        result: content
      };
    } else {
      return {
        success: false,
        result: 'No content in response'
      };
    }
  } catch (error) {
    return {
      success: false,
      result: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}