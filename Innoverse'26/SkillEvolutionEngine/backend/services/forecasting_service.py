import math
from typing import Dict, Any, List
from datetime import datetime, timedelta

def linear_regression(x: List[float], y: List[float]):
    """
    Computes simple linear regression (y = mx + c) using pure Python.
    Returns (m, c).
    """
    n = len(x)
    if n == 0:
        return 0.0, 0.0
        
    sum_x = sum(x)
    sum_y = sum(y)
    sum_xy = sum(xi * yi for xi, yi in zip(x, y))
    sum_xx = sum(xi * xi for xi in x)
    
    denominator = (n * sum_xx - sum_x * sum_x)
    if denominator == 0:
        return 0.0, sum_y / n
        
    m = (n * sum_xy - sum_x * sum_y) / denominator
    c = (sum_y - m * sum_x) / n
    return m, c

def forecast_skill_demand(historical_dates_str: List[str], historical_frequencies: List[int], target_skill: str, months_ahead: int = 12) -> Dict[str, Any]:
    """
    Simulates forecasting future demand for a skill using pure Python standard library math.
    """
    if not historical_frequencies:
        return {"skill": target_skill, "error": "No historical data provided."}

    # Convert date strings to datetime objects and then to ordinal floats for regression
    dates = [datetime.strptime(d, "%Y-%m-%d") for d in historical_dates_str]
    x_vals = [float(d.toordinal()) for d in dates]
    y_vals = [float(f) for f in historical_frequencies]
    
    # Calculate trend (slope: m, intercept: c)
    m, c = linear_regression(x_vals, y_vals)
    
    # Predict future
    last_date = dates[-1]
    # Rough approximation of 1 month = 30.44 days
    future_dates = [last_date + timedelta(days=int(30.44 * i)) for i in range(1, months_ahead + 1)]
    future_x = [float(d.toordinal()) for d in future_dates]
    
    future_y = [max(0.0, m * fx + c) for fx in future_x]  # Demand can't be negative
    
    # Generate Demand Score (0-100) based on projected slope and current volume
    current_demand = y_vals[-1]
    projected_demand = future_y[-1]
    
    growth_rate = 0.0
    if current_demand > 0:
        growth_rate = ((projected_demand - current_demand) / current_demand) * 100
        
    # Arbitrary scoring logic for demo: Base score 50 + growth factor + volume factor
    demand_score = min(100.0, max(0.0, 50.0 + (growth_rate * 0.5) + (current_demand * 0.1)))
    
    return {
        "skill": target_skill,
        "current_frequency": int(current_demand),
        "predicted_frequency_12m": int(projected_demand),
        "growth_rate_pct": round(growth_rate, 2),
        "demand_score": round(demand_score, 2),
        "trend": "rising" if growth_rate > 5 else "stable" if growth_rate > -5 else "declining"
    }

if __name__ == "__main__":
    # Test the forecasting engine with dummy data for 'Python'
    import random
    
    base_date = datetime(2023, 1, 1)
    dates_str = [(base_date + timedelta(days=30*i)).strftime("%Y-%m-%d") for i in range(24)]
    
    # Simulating upward trend
    frequencies = [int(100 + (i * 5) + random.randint(-10, 10)) for i in range(24)]
    
    forecast = forecast_skill_demand(dates_str, frequencies, "python")
    print(f"Prophet-Style Forecast for Python:\n{forecast}")
