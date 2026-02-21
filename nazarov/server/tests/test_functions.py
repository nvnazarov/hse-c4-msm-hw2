from app.core.functions import rastrigin, compute_mesh
import numpy as np


def test_rastrigin():
    assert rastrigin(np.asarray([0, 0, 0], dtype=np.float64)) == np.float64(0)
    assert np.allclose(
        rastrigin(
            np.asarray([[0, 0, 0], [0, 1, 0], [1, 1, 1], [1, 2, 3]], dtype=np.float64)
        ),
        np.asarray([0, 1, 3, 14], dtype=np.float64),
    )


def test_compute_mesh():
    mesh = compute_mesh(rastrigin, [None, 1, None], [0, 0, 0], [5, 5, 5], steps=[6, 6, 6])
    assert mesh == [
        [1, 2, 5, 10, 17, 26],
        [2, 3, 6, 11, 18, 27],
        [5, 6, 9, 14, 21, 30],
        [10, 11, 14, 19, 26, 35],
        [17, 18, 21, 26, 33, 42],
        [26, 27, 30, 35, 42, 51],
    ]
