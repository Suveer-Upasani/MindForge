import os
import json
from openai import OpenAI

def generate_defect_report(product_id: str, product_category: str, anomaly_score: float, heatmap_base64: str):
    """
    Call Grok API to generate a JSON report based on heatmap and score.
    """
    api_key = os.environ.get("GROK_API_KEY", "")
    if not api_key:
        # Fallback if no API key is set to prevent total crash
        return {
            "defect_type": "Unknown - API key missing",
            "location": "N/A",
            "cause_explanation": "Could not contact Grok API without key.",
            "suggested_fix": "Configure GROK_API_KEY in environment."
        }
        
    client = OpenAI(api_key=api_key, base_url="https://api.x.ai/v1")
    
    prompt = f"""
    You are an expert AI system for visual quality inspection.

    Analyze the defect heatmap of a '{product_category}' (Product ID: {product_id}).
    The computed anomaly score is {anomaly_score}.

    The heatmap uses a JET colormap where:
    - Red indicates high anomaly intensity
    - Blue indicates low anomaly intensity

    Based on this, identify and interpret the defect.

    Return ONLY a valid JSON object with the following keys:
    - "defect_type": Short, precise name of the defect
    - "location": Specific area where the defect is observed
    - "cause_explanation": Likely root cause of the defect
    - "suggested_fix": Clear and actionable recommendation
    """
    
    try:
        response = client.chat.completions.create(
            model="grok-3",
            messages=[
                {
                    "role": "system",
                    "content": "Always return valid JSON. Do not include markdown formatting like ```json."
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{heatmap_base64}"
                            }
                        }
                    ]
                }
            ],
            temperature=0,
            max_tokens=600,
            response_format={"type": "json_object"}
        )
        
        reply = response.choices[0].message.content
        return json.loads(reply.strip())
        
    except Exception as e:
        return {
            "defect_type": "API Error",
            "location": "Unknown",
            "cause_explanation": f"Failed to infer from Grok: {str(e)}",
            "suggested_fix": "Check API logs and keys."
        }
