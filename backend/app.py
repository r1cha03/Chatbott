# import os
# from llama_cpp import Llama
# import mysql.connector
# from mysql.connector import Error
# from dotenv import load_dotenv
# from fastapi import FastAPI, Request
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel

# load_dotenv()

# # -------------------- Load SQLCoder GGUF Model --------------------
# llm = Llama.from_pretrained(
#     repo_id="defog/sqlcoder-7b-2",
#     filename="sqlcoder-7b-q5_k_m.gguf",
#     n_ctx=2048,
#     n_threads=8,
#     verbose=False
# )

# # -------------------- FastAPI Setup --------------------
# app = FastAPI()

# # Allow frontend (e.g., React) to connect
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173","http://localhost:3000"],  # React dev server
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # -------------------- Request Schema --------------------
# class QueryRequest(BaseModel):
#     prompt: str

# # -------------------- Phase 1: NL → SQL --------------------
# def convert_to_sql(prompt: str) -> str:
#     """Use the quantized LLaMA model to turn NL into an SQL string."""
#     formatted = (
#         "### Instruction:\n"
#         "Convert the following question to SQL:\n"
#         f"{prompt}\n"
#         "### SQL:"
#     )
#     result = llm(
#         formatted,
#         max_tokens=256,
#         temperature=0.0,
#         stop=["###", "Instruction:"]
#     )
#     sql = result["choices"][0]["text"].strip()
#     print("\n Generated SQL:\n", sql)
#     return sql

# # -------------------- Phase 2: Run SQL --------------------
# def run_query(sql: str):
#     """Execute the given SQL against MySQL and return result."""
#     DB_CONFIG = {
#         "host":     os.getenv("DB_HOST", "localhost"),
#         "user":     os.getenv("DB_USER", "root"),
#         "password": os.getenv("DB_PASS", "root"),
#         "database": os.getenv("DB_NAME", "ddu"),
#     }
#     try:
#         conn = mysql.connector.connect(**DB_CONFIG)
#         cursor = conn.cursor()
#         cursor.execute(sql)

#         if cursor.with_rows:
#             rows = cursor.fetchall()
#             return rows
#         else:
#             conn.commit()
#             return f"{cursor.rowcount} row(s) affected."

#     except Error as e:
#         return f"MySQL Error: {e}"
#     finally:
#         if 'conn' in locals() and conn.is_connected():
#             cursor.close()
#             conn.close()

# # -------------------- API Endpoint: /health --------------------
# @app.get("/health") 
# def health_check():
#     """Simple health check endpoint."""
#     return {"status": "ok", "message": "API is running"}
# # -------------------- API Endpoint: /ask --------------------
# @app.post("/ask")
# def ask_query(req: QueryRequest):
#     print('Inside /ask endpoint')
#     """API route to accept NL question and return SQL + result."""
#     sql = convert_to_sql(req.prompt)
#     result = run_query(sql)

#     print("\n SQL Execution Result:\n", result)
#     return {
#         "sql": sql,
#         "result": result
#     }

# # -------------------- CLI Mode --------------------
# if __name__ == "__main__":
#     print("NL → SQL → MySQL Executor\nType 'exit' to quit.")
#     while True:
#         prompt = input("\nEnter question: ")
#         if prompt.strip().lower() == "exit":
#             break
#         sql = convert_to_sql(prompt)
#         result = run_query(sql)
#         print("\n Result:\n", result)



import os
from dotenv import load_dotenv
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
from mysql.connector import Error

# -------------------- Load environment variables --------------------
load_dotenv()

# -------------------- FastAPI Setup --------------------
app = FastAPI()

# Allow frontend (React) to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- Request Schema --------------------
class QueryRequest(BaseModel):
    prompt: str

# -------------------- Phase 1: NL → SQL  via OpenRouter --------------------
def convert_to_sql(prompt: str) -> str:
    
    # Get API key from environment variable
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return "-- Error: OPENROUTER_API_KEY not found in environment variables"
    
    # Try a faster, more reliable model first
    model = os.getenv("OPENROUTER_MODEL", "openai/gpt-3.5-turbo")
    
    # Fallback to a simple SQL generation for testing
    if not api_key or api_key == "your_actual_api_key_here":
        return print("Using fallback SQL generation (no valid API key)")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "NL to SQL App",
        "Content-Type": "application/json"
    }

    # Create a formatted prompt for better SQL generation
    formatted_prompt = f"""
    Convert the following natural language query to SQL:
    
    Query: {prompt}
    
    Please provide only the SQL query without any explanation or markdown formatting.
    """

    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are an AI assistant that converts natural language into SQL queries. Return only the SQL query without any explanation or markdown formatting."},
            {"role": "user", "content": formatted_prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 512
    }

    try:
        print(f"Sending request to OpenRouter with model: {model}")
        print(f"API Key exists: {bool(api_key)}")
        
        # Reduce timeout to 15 seconds
        response = httpx.post(
            "https://openrouter.ai/api/v1/chat/completions", 
            headers=headers, 
            json=data, 
            timeout=15
        )
        
        print(f"Response status: {response.status_code}")
        response.raise_for_status()
        
        content = response.json()
        sql = content["choices"][0]["message"]["content"].strip()
        
        # Clean up the SQL if it has markdown formatting
        if sql.startswith("```sql"):
            sql = sql.replace("```sql", "").replace("```", "").strip()
        elif sql.startswith("```"):
            sql = sql.replace("```", "").strip()
            
        print(f"Generated SQL: {sql}")
        return sql
        
    except httpx.TimeoutException:
        error_msg = "Request to OpenRouter timed out - using fallback"
        return print(f"Error: {error_msg}")
    except httpx.HTTPStatusError as e:
        error_msg = f"OpenRouter API error: {e.response.status_code}"
        if e.response.status_code == 401:
            error_msg += " - Invalid API key"
        elif e.response.status_code == 429:
            error_msg += " - Rate limit exceeded"
        elif e.response.status_code == 404:
            error_msg += f" - Model {model} not found"
        return print(f"Error: {error_msg}")
        print("Falling back to simple SQL generation...")

    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        return print(f"Error: {error_msg}")

# -------------------- Phase 2: Run SQL on MySQL --------------------
def run_query(sql: str):
    """Execute the given SQL against MySQL and return result."""
    # Skip execution if SQL contains an error
    if sql.startswith("-- Error:"):
        return "Cannot execute query due to SQL generation error"
    
    DB_CONFIG = {
        "host":     os.getenv("DB_HOST", "localhost"),
        "user":     os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASS", "root"),
        "database": os.getenv("DB_NAME", "ddu"),
    }
    
    conn = None
    cursor = None
    
    try:
        print(f"Connecting to MySQL database: {DB_CONFIG['database']}")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print(f"Executing SQL: {sql}")
        cursor.execute(sql)

        if cursor.with_rows:
            rows = cursor.fetchall()
            # Convert to list of dictionaries for better JSON serialization
            columns = [desc[0] for desc in cursor.description]
            result = [dict(zip(columns, row)) for row in rows]
            print(f"Query returned {len(result)} rows")
            return result
        else:
            conn.commit()
            result = f"{cursor.rowcount} row(s) affected."
            print(result)
            return result

    except Error as e:
        error_msg = f"MySQL Error: {str(e)}"
        print(error_msg)
        return error_msg
    except Exception as e:
        error_msg = f"Unexpected database error: {str(e)}"
        print(error_msg)
        return error_msg
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

# -------------------- API Endpoint: /health --------------------
@app.get("/health")
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "message": "API is running"}

# -------------------- API Endpoint: /ask --------------------
@app.post("/ask")
def ask_query(req: QueryRequest):
    print(f'Received request: {req.prompt}')
    
    try:
        sql = convert_to_sql(req.prompt)
        result = run_query(sql)

        print(f"Final result: {result}")
        return {
            "sql": sql,
            "result": result
        }
    except Exception as e:
        error_msg = f"Error processing request: {str(e)}"
        print(error_msg)
        return {
            "error": error_msg,
            "sql": None,
            "result": None
        }

# -------------------- CLI Mode --------------------
if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server...")
    print("NL → SQL → MySQL Executor")
    print("Server will run on http://localhost:8000")
    print("Health check available at: http://localhost:8000/health")
    
    # Start the FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")