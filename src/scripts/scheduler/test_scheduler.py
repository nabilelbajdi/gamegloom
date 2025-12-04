import asyncio
from scripts.scheduler import update_all_games

async def test_scheduler():
    try:
        await update_all_games()
    except Exception as e:
        print(f"Error running scheduler: {e}")

if __name__ == "__main__":
    asyncio.run(test_scheduler())
