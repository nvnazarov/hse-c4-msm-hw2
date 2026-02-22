import numpy as np

from app.core.aha import FitnessFunction, FoodSource


def rastrigin(x: FoodSource):
    d = x.shape[-1]
    return 10 * d + np.sum(np.square(x) - 10 * np.cos(2 * np.pi * x), axis=-1)


def stepint(x: FoodSource):
    return 25 + np.sum(np.floor(x), axis=-1)


def compute_mesh(
    f: FitnessFunction,
    dims: list[float | None],
    low: list[float],
    up: list[float],
    steps: list[int],
):
    N = len(dims)
    free_dims = [i for i, v in enumerate(dims) if v is None]
    axes = [np.linspace(low[i], up[i], steps[i]) for i in free_dims]
    mesh = np.meshgrid(*axes, indexing="ij")
    mesh_shape = mesh[0].shape if mesh else ()
    X = np.empty(mesh_shape + (N,), dtype=np.float64)
    free_i = 0
    for dim in range(N):
        if dims[dim] is None:
            X[..., dim] = mesh[free_i]
            free_i += 1
        else:
            X[..., dim] = dims[dim]
    return f(X).tolist()
