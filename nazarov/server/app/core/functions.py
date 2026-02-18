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

