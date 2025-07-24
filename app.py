from langgraph.graph import StateGraph, END
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from utils import vectorstore
import os
from dotenv import load_dotenv

load_dotenv()

llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.3-70b-versatile",
    temperature=0.2,
    max_tokens=1000
)

class ChatMemoryState(dict):
    history: list
    question: str
    context: str
    answer: str

decision_prompt = ChatPromptTemplate.from_template("""
You are Loubby Navigator developed by Team Sigma, focused solely on the Loubby job search platform.
Decide if detailed info from the Loubby knowledge base is needed for this question.
Question: {question}
Decision (YES or NO):
""")

def truncate_text(text, max_tokens=2000):
    max_chars = max_tokens * 4
    return text[:max_chars] + "..." if len(text) > max_chars else text

def dynamic_memory_agent_step(state):
    query = state["question"]
    history = state.get("history", [])[-2:]

    decision_response = llm.invoke(decision_prompt.format(question=query)).content.strip().upper()
    print(f"DEBUG: Decision for '{query}': {decision_response}")

    retrieved_docs = vectorstore.similarity_search(query, k=3, namespace="loubby-navigation")
    context = "\n".join(doc.page_content for doc in retrieved_docs) if retrieved_docs else "No specific Loubby data found."
    context = truncate_text(context, max_tokens=1500)
    print(f"DEBUG: Context length for '{query}': {len(context)} chars")


    prompt_text = f"""
    You are Loubby Navigator by Team Sigma, assisting exclusively with the Loubby job search platform at <https://app.loubby.ai/>.
    Using only this context from the Loubby knowledge base (no external knowledge), answer: {query}
    Context: {context}
    If the question is unrelated to Loubby or context is insufficient, say: 'I can only assist with the Loubby platform. Please ask a Loubby-related question.'
    Keep your answer concise (under 1000 tokens).
    """

    try:
        response = llm.invoke(prompt_text, temperature=0.3, max_tokens=1000)
        print(f"DEBUG: LLM response length: {len(response.content)} chars")
    except Exception as e:
        print(f"DEBUG: LLM error: {str(e)}")
        return {
            "answer": "Sorry, I hit a rate limit. Please try a shorter question or wait a moment.",
            "context": context,
            "history": history
        }

    history.append(f"User: {query}")
    history.append(f"Loubby Navigator: {response.content}")

    return {
        "answer": response.content,
        "context": context,
        "history": history
    }

dynamic_memory_graph = StateGraph(ChatMemoryState)
dynamic_memory_graph.add_node("dynamic_memory_agent", dynamic_memory_agent_step)
dynamic_memory_graph.set_entry_point("dynamic_memory_agent")
dynamic_memory_graph.add_edge("dynamic_memory_agent", END)
dynamic_memory_app = dynamic_memory_graph.compile()
