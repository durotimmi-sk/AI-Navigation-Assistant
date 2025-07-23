import os
from dotenv import load_dotenv
import pinecone
from langchain_pinecone import PineconeVectorStore
from langchain_core.embeddings import Embeddings
from sentence_transformers import SentenceTransformer

load_dotenv()

class LocalEmbeddings(Embeddings):
    def __init__(self):
        self.model = None

    def _load_model(self):
        if self.model is None:
            self.model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        return self.model

    def embed_query(self, text: str):
        return self._load_model().encode(text).tolist()

    def embed_documents(self, texts: list[str]):
        return self._load_model().encode(texts).tolist()

embedding = LocalEmbeddings()
pc = pinecone.Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))
vectorstore = PineconeVectorStore(index=index, embedding=embedding, namespace="loubby-navigation")

print(f"Vectorstore initialized: {vectorstore is not None}")
