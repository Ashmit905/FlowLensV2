if __name__ == "__main__":
    import uvicorn

    # Run with autoreload for development
    uvicorn.run("api.handlers:app", host="127.0.0.1", port=8000, reload=True)
