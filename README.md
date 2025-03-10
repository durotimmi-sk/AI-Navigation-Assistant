# Loubby AI Navigation Assistant

A navigation assistant for Loubby AI, built to guide users through the platform with multilingual support, video, and audio features. This project was developed as part of a week-long sprint with Divverse Labs.

## Features
- **Multilingual Support:** Language detection and responses in multiple languages.
- **Video & Audio Integration:** Synced avatar video with audio responses for an interactive experience.
- **Agentic AI:** Uses Retrieval-Augmented Generation (RAG) to provide accurate answers from Loubby’s knowledge base.
- **Speech Recognition:** Supports voice input for hands-free navigation.

## Tech Stack
- **FastAPI:** Backend API framework for handling requests and responses.
- **Pinecone:** Vector storage for efficient semantic search.
- **Groq:** Fast language model inference for generating responses.
- **LangChain:** Chains together LLM logic for structured workflows.
- **LangGraph:** Builds agentic workflows for adaptive responses.
- **Sentence Transformer:** Converts text to embeddings for semantic understanding.
- **MongoDB:** Stores user feedback and chat history.
- **JavaScript/HTML/CSS:** Frontend for video/audio syncing and UI.

## How It Works
1. **Backend:** FastAPI serves the API, interfacing with Pinecone for vector search and Groq for LLM responses.
2. **RAG Pipeline:** LangChain and LangGraph fetch relevant data (via Sentence Transformer embeddings) and generate context-aware answers.
3. **Frontend:** JavaScript handles video/audio syncing, multilingual toggling, and speech recognition for voice input.
4. **Storage:** MongoDB stores chat history and user preferences.

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/durotimmi-sk/loubby-ai-navigation-assistant.git
   cd loubby-ai-navigation-assistant
