// useComboCounter.js
import {EchoFilters} from "../../optimizer/EchoFilters.js";

export function useComboCounter({
                                    countEchoCombos,
                                    comboTimerRef,
                                    // state values
                                    statWeight,
                                    echoBag,
                                    keepPercent,
                                    setOptions,
                                    mainStatFilter,
                                    mainEcho,
                                    filtered,
                                    // setters
                                    setFiltered,
                                    setPendingCombinations,
                                    setCombinations,
                                    updateGeneralOptimizerSettings,
                                    updateOptimizerSettings,
                                }) {
    let currentRun = 0;

    function scheduleComboCount({ echoes, lockedEchoId = null }) {
        if (!echoes || echoes.length === 0) {
            setCombinations(0);
            setPendingCombinations(false);
            return;
        }

        setPendingCombinations(true);

        if (comboTimerRef.current) {
            clearTimeout(comboTimerRef.current);
        }

        const runId = ++currentRun;

        comboTimerRef.current = setTimeout(async () => {
            if (currentRun !== runId) return;

            const total = await countEchoCombos({
                echoes,
                maxCost: 12,
                maxSize: 5,
                lockedEchoId,
            });

            if (currentRun !== runId) return;

            setCombinations(total);
            setPendingCombinations(false);
        }, 300);
    }

    function buildFilterForm(overrides = {}) {
        return {
            statWeight,
            echoBag,
            keepPercent,
            setOptions,
            mainStatFilter,
            ...overrides,
        };
    }

    function handleFilteredChange(newPercent) {
        updateGeneralOptimizerSettings({ keepPercent: newPercent });

        const freshForm = buildFilterForm({ keepPercent: newPercent });
        const updatedFiltered = EchoFilters.getFilteredEchoes(freshForm);
        setFiltered(updatedFiltered);

        scheduleComboCount({ echoes: updatedFiltered, lockedEchoId: mainEcho?.id ?? null });
    }

    function handleSetOptionChange(newSetOptions) {
        updateOptimizerSettings({ setOptions: newSetOptions });

        const freshForm = buildFilterForm({ setOptions: newSetOptions });
        const updatedFiltered = EchoFilters.getFilteredEchoes(freshForm);
        setFiltered(updatedFiltered);

        scheduleComboCount({ echoes: updatedFiltered, lockedEchoId: mainEcho?.id ?? null });
    }

    function handleMainEchoChange(nextMainEcho) {
        updateOptimizerSettings({ mainEcho: nextMainEcho });

        scheduleComboCount({ echoes: filtered, lockedEchoId: nextMainEcho?.id ?? null });
    }

    function handleMainStatFilterChange(newFilter) {
        updateOptimizerSettings({ mainStatFilter: newFilter });

        const freshForm = buildFilterForm({ mainStatFilter: newFilter });
        const updatedFiltered = EchoFilters.getFilteredEchoes(freshForm);
        setFiltered(updatedFiltered);

        scheduleComboCount({ echoes: updatedFiltered, lockedEchoId: mainEcho?.id ?? null });
    }

    return {
        handleFilteredChange,
        handleSetOptionChange,
        handleMainEchoChange,
        handleMainStatFilterChange,
    };
}