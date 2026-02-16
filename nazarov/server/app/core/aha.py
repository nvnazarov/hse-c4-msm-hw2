from typing import Callable

import numpy as np

FoodSource = np.ndarray[tuple[int, ...], np.dtype[np.float64]]
FitnessFunction = Callable[[FoodSource], np.float64]


def to_food_source(obj: list[float]) -> FoodSource:
    return np.asarray(obj)


class MaxStepsReachedError(Exception): ...


class AHA:
    """AHA algorithm implementation.

    Parameters
    ----------
    n : int
        Total number of hummingbirds
    d : int
        Number of dimensions in the solution (food sources) space
    max_steps : int
        Max number of iterations
    low : FoodSource
        Lower boundary
    up : FoodSource
        Upper boundary
    f : FitnessFunction
        Fitness function
    """

    def __init__(
        self,
        *,
        n: int,
        d: int,
        max_steps: int,
        low: FoodSource,
        up: FoodSource,
        f: FitnessFunction,
    ):
        if n <= 0:
            raise ValueError(f"Number of hummingbirds must be positive ({n} provided)")
        if d <= 0:
            raise ValueError(f"Number of dimensions must be positive ({d} provided)")
        if low.shape != (d,):
            raise ValueError(f"Low has incorrect shape {low.shape}, expected ({d},)")
        if up.shape != (d,):
            raise ValueError(f"Up has incorrect shape {up.shape}, expected ({d},)")

        self._n = n
        self._d = d
        self._max_steps = max_steps
        self._fitness_function = f
        self._low = low
        self._up = up

        try:
            _ = self._fitness_function(self._low)
            _ = self._fitness_function(self._up)
        except RuntimeError as e:
            raise ValueError(f"Something is wrong with the fitness function: {e}")

        self._visit_table = VisitTable(n)

        def random_food_source():
            return self._low + np.multiply(
                np.random.sample((self._d,)), self._up - self._low
            )

        self.hummingbirds = [
            Hummingbird(
                index=index,
                n=n,
                d=d,
                vt=self._visit_table,
                fitness_function=self._fitness_function,
                food_source=random_food_source(),
                low=self._low,
                up=self._up,
            )
            for index in range(self._n)
        ]
        self._step = 0

    @staticmethod
    def init_from(
        *,
        step: int,
        max_steps: int,
        low: FoodSource,
        up: FoodSource,
        f: FitnessFunction,
        visit_table: "VisitTable",
        food_sources: list[FoodSource],
    ) -> "AHA":
        n = len(food_sources)

        if visit_table.table().shape != (n, n):
            raise ValueError("visit table shape is invalid")

        d = low.size
        aha = AHA(n=n, d=d, max_steps=max_steps, low=low, up=up, f=f)
        aha._step = step
        aha._visit_table = visit_table
        aha.hummingbirds = [
            Hummingbird(
                index=index,
                n=n,
                d=d,
                vt=aha._visit_table,
                fitness_function=f,
                food_source=food_sources[index],
                low=low,
                up=up,
            )
            for index in range(n)
        ]
        return aha

    def get_visit_table(self):
        return self._visit_table.table()

    def get_step(self):
        return self._step

    def step(self):
        if self._step >= self._max_steps:
            raise MaxStepsReachedError
        self._step += 1
        for hummingbird in self.hummingbirds:
            if np.random.uniform(0, 1) < 0.5:
                hummingbird.guided_foraging(self.hummingbirds)
            else:
                hummingbird.territorial_foraging()
        if self._step % (2 * self._n) == 0:
            worst_hummingbird = sorted(
                self.hummingbirds,
                key=lambda hb: hb.get_fitness_value(),
                reverse=True,
            )[0]
            worst_hummingbird.migrating_foraging()


class Hummingbird:
    """Models a hummingbird.

    A hummingbird is alaways attached to some food source
    and can leverage three different strategies to search
    for new food sources.

    Parameters
    ----------
    index : int
        Index of this hummingbird in the visit table
    n : int
        Total number of hummingbirds
    d : int
        Number of dimensions in the solution (food sources) space
    vt : VisitTable
        The visit table
    fitness_function : FitnessFunction
        A function that computes the fitness value for any given food source
    food_source : FoodSource
        The food source that the hummingbird is attached to
    low : FoodSource
        The lower bound for food sources
    up : FoodSource
        The upper bound for food sources
    """

    def __init__(
        self,
        index: int,
        n: int,
        d: int,
        vt: "VisitTable",
        fitness_function: FitnessFunction,
        food_source: FoodSource,
        low: FoodSource,
        up: FoodSource,
    ):
        self._index = index
        self._n = n
        self._d = d
        self._vt = vt
        self._fitness_function = fitness_function
        self._low = low
        self._up = up
        self._fitness_value = fitness_function(food_source)
        self._food_source = food_source

    def get_food_source(self) -> FoodSource:
        return self._food_source.copy()

    def get_fitness_value(self):
        return self._fitness_value

    def guided_foraging(self, hummingbirds: list["Hummingbird"]):
        d = self.direction_switch_vector()
        a = np.random.normal(0, 1, (self._d,))
        highest_levels_indices = self._vt.get_highest_visit_levels(self._index)
        target_food_source_index = self._index
        target_food_source = self._food_source
        if len(highest_levels_indices) > 0:
            target_food_source_index = highest_levels_indices[0]
            target_food_source = hummingbirds[target_food_source_index]._food_source
            target_fitness_value = hummingbirds[target_food_source_index]._fitness_value
            for i in highest_levels_indices:
                if target_fitness_value > hummingbirds[i]._fitness_value:
                    target_fitness_value = hummingbirds[i]._fitness_value
                    target_food_source_index = i
                    target_food_source = hummingbirds[i]._food_source
        # fmt: off
        candidate_food_source = target_food_source + a * d * (self._food_source - target_food_source)
        candidate_food_source = np.clip(candidate_food_source, self._low, self._up)
        # fmt: on
        if (fv := self._fitness_function(candidate_food_source)) < self._fitness_value:
            self._food_source = candidate_food_source
            self._fitness_value = fv
            self._vt.increase_visit_level(self._index)
            self._vt.reset_visit_level(self._index, target_food_source_index)
            self._vt.record_food_source_update(self._index)
        else:
            self._vt.increase_visit_level(self._index)
            self._vt.reset_visit_level(self._index, target_food_source_index)

    def migrating_foraging(self):
        self._food_source = self._low + np.multiply(
            np.random.sample((self._d,)), self._up - self._low
        )
        self._fitness_value = self._fitness_function(self._food_source)
        self._vt.increase_visit_level(self._index)
        self._vt.record_food_source_update(self._index)

    def territorial_foraging(self):
        d = self.direction_switch_vector()
        b = np.random.normal(0, 1, (self._d,))
        candidate_food_source = self._food_source + b * d * (self._up - self._low)
        candidate_food_source = np.clip(candidate_food_source, self._low, self._up)
        if (fv := self._fitness_function(candidate_food_source)) < self._fitness_value:
            self._food_source = candidate_food_source
            self._fitness_value = fv
            self._vt.increase_visit_level(self._index)
            self._vt.record_food_source_update(self._index)
        else:
            self._vt.increase_visit_level(self._index)

    def direction_switch_vector(self):
        variant = np.random.randint(0, 3)
        if variant == 0:
            # axial flight
            i = np.random.randint(0, self._d)
            d = np.zeros((self._d,))
            d[i] = 1
            return d
        if variant == 1 and self._d > 2:
            # diagonal flight
            k = np.random.randint(2, self._d)
            mask = np.random.permutation(self._d) < k
            d = np.zeros((self._d,))
            d[mask] = 1
            return d
        return np.ones((self._d,))  # omnidirectional flight


class VisitTable:
    """Represents the visit table as defined in the original article.

    The visit table records the visit level for each food source
    for different hummingbirds, which denotes the amount of time
    since the same hummingbird last visited a certain food source
    so far.

    Parameters
    ----------
    n : int
        Number of hummingbirds
    """

    def __init__(self, n: int):
        if n <= 0:
            raise ValueError(f"Number of hummingbirds must be positive ({n} provided)")
        self._n = n
        self._vt = np.zeros((n, n))

    @staticmethod
    def init_from(vt: list[list[int]]) -> "VisitTable":
        if len(vt) == 0:
            raise ValueError("empty visit table")
        if len(vt) != len(vt[0]):
            raise ValueError("visit table must be a square matrix")
        v = VisitTable(len(vt))
        v._vt = np.asarray(vt)
        return v

    def get_highest_visit_levels(self, hummingbird_index: int) -> list[int]:
        row = self._vt[hummingbird_index, :]
        return list[int](np.where(row == np.max(row))[0])

    def record_food_source_update(self, hummingbird_index: int):
        mask = np.ones_like(self._vt) - np.eye(self._n)
        mask[:, hummingbird_index] = 0
        maxes = np.max(self._vt * mask, axis=1) + 1
        self._vt[:, hummingbird_index] = maxes

    def reset_visit_level(self, hummingbird_index: int, food_source_index: int):
        self._vt[hummingbird_index, food_source_index] = 0

    def increase_visit_level(self, hummingbird_index: int):
        self._vt[hummingbird_index, :] += 1

    def table(self) -> np.ndarray[tuple[int, ...], np.dtype[np.float64]]:
        return self._vt.copy()
