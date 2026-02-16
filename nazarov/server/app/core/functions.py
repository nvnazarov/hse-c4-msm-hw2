import numpy as np

from app.core.aha import FoodSource


def rastrigin(x: FoodSource):
    """A Rastrigin function implementation

    Rastrigin function is a non-convex function used as a performance test problem
    for optimization algorithms. It is a typical example of non-linear multimodal
    function. Finding the minimum of this function is a fairly difficult problem
    due to its large search space and its large number of local minima.

    The global minimum is at 0.
    """
    d = x.size
    return 10 * d + np.sum(np.square(x) - 10 * np.cos(2 * np.pi * x))


def stepint(x: FoodSource):
    return 25 + np.sum(np.floor(x))


def rosenbrok(a: np.float64, b: np.float64):
    """A Rosenbrok function implementation

    The global minimum is inside a long, narrow, parabolic-shaped flat valley.
    To find the valley is trivial. To converge to the global minimum, however,
    is difficult.

    The global minimum is at (a, a*a).
    """

    def fitness_function(x: FoodSource):
        if x.shape != (2,):
            raise ValueError("Number of dimensions must be 2 for Rosenbrok function")
        return (a - x[0]) ** 2 + b * (x[1] - x[0] ** 2) ** 2

    return fitness_function
