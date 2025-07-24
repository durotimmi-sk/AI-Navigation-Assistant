import os
from dotenv import load_dotenv
import pinecone
from langchain_pinecone import PineconeVectorStore
from langchain_core.embeddings import Embeddings
from sentence_transformers import SentenceTransformer

load_dotenv()

class DummyEmbeddings(Embeddings):
    def embed_query(self, text: str):
        return [0] * 384 
   
    def embed_documents(self, texts: list[str]):
        return [[0] * 384 for _ in texts]

#class LocalEmbeddings(Embeddings):
  #  def __init__(self):
  #      self.model = SentenceTransformer("sentence-transformers/all-MiniLM-L12-v1")
    
  #  def embed_query(self, text: str):
   #     return self.model.encode(text).tolist()
    
   # def embed_documents(self, texts: list[str]):
    #    return self.model.encode(texts).tolist()

#embedding = LocalEmbeddings()
pc = pinecone.Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))
vectorstore = PineconeVectorStore(index=index, embedding=DummyEmbeddings(), namespace="loubby-navigation")

print(f"Vectorstore initialized: {vectorstore is not None}")
