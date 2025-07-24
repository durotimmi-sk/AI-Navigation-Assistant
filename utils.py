import os
from dotenv import load_dotenv
import pinecone
from langchain_pinecone import PineconeVectorStore
from langchain_core.embeddings import Embeddings
from sentence_transformers import SentenceTransformer

load_dotenv()

class LocalEmbeddings(Embeddings):
    def __init__(self):
        self.model = SentenceTransformer("sentence-transformers/all-MiniLM-L12-v1")
    
    def embed_query(self, text: str):
        return self.model.encode(text).tolist()
    
    def embed_documents(self, texts: list[str]):
        return self.model.encode(texts).tolist()

embedding = LocalEmbeddings()
pc = pinecone.Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))
vectorstore = PineconeVectorStore(index=index, embedding=embedding, namespace="loubby-navigation")

print(f"Vectorstore initialized: {vectorstore is not None}")
