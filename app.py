import os
from llama_cpp import Llama
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv  

load_dotenv()

# Phase 1: Load & configure the NL→SQL model
llm = Llama.from_pretrained(
    repo_id="defog/sqlcoder-7b-2",
    filename="sqlcoder-7b-q5_k_m.gguf",
    n_ctx=2048,
    n_threads=8,
    verbose=False
)

def convert_to_sql(prompt: str) -> str:
    """Use the quantized LLaMA model to turn NL into an SQL string."""
    formatted = (
        "### Instruction:\n"
        "Convert the following question to SQL:\n"
        f"{prompt}\n"
        "### SQL:"
    )
    result = llm(
        formatted,
        max_tokens=256,
        temperature=0.0,
        stop=["###", "Instruction:"]
    )
    sql = result["choices"][0]["text"].strip()
    print("\n Generated SQL:\n", sql)
    return sql

# Phase 2: Connect to MySQL & run the query
def run_query(sql: str):
    """Execute the given SQL against MySQL and print results."""
    DB_CONFIG = {
        "host":     os.getenv("DB_HOST", "localhost"),
        "user":     os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASS", ""),
        "database": os.getenv("DB_NAME", "ai_test"),
    }
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute(sql)

        if cursor.with_rows:
            rows = cursor.fetchall()
            print("\n Query Results:")
            for row in rows:
                print(row)
        else:
            conn.commit()
            print(f"\n Query executed. {cursor.rowcount} row(s) affected.")

    except Error as e:
        print(f"\n MySQL Error: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# CLI Loop: Ask → Generate → Execute
if __name__ == "__main__":
    print("NL → SQL → MySQL Executor\nType 'exit' to quit.")
    while True:
        prompt = input("\n Enter question: ")
        if prompt.strip().lower() == "exit":
            break
        sql = convert_to_sql(prompt)
        run_query(sql)




