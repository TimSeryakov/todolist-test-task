import {v1} from 'uuid'
import {arrayMove} from 'react-movable'
import {ThunkDispatchType} from './store'
import {TASKS_API} from '../api/api'
import {NOTIFICATIONS, setNotificationMessageAC} from './notification-reducer'

// ---------------------------------------------------------------------------------------------------------------------
// Init State
// ---------------------------------------------------------------------------------------------------------------------

export const initialState: TodoListStateType = {
    tasks: [],
    isFetching: false
}

// ---------------------------------------------------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------------------------------------------------

export type TodoListStateType = {
    tasks: TaskDataType[]
    isFetching: boolean
}


export type TaskDataType = {
    id: string
    order: number
    title: string
    status: TaskStatusType
}

export type TaskStatusType = "done" | "active"

// ---------------------------------------------------------------------------------------------------------------------
// Action Creators Types
// ---------------------------------------------------------------------------------------------------------------------

export type TodoListActionTypes =
    | ReturnType<typeof setTasksAC>
    | ReturnType<typeof setIsSyncing>
    | ReturnType<typeof addTaskAC>
    | ReturnType<typeof removeTaskAC>
    | ReturnType<typeof toggleTaskStatusAC>
    | ReturnType<typeof editTaskTitleAC>
    | ReturnType<typeof changeTaskOrderAC>


// ---------------------------------------------------------------------------------------------------------------------
// Enum (const)
// ---------------------------------------------------------------------------------------------------------------------

enum TODO {
    SET_TASKS_DATA = "TODO/SET_TASKS_DATA",
    SET_TASKS_IS_FETCHING = "TODO/SET_TASKS_IS_FETCHING",
    ADD_TASK = "TODO/ADD_TASK",
    REMOVE_TASK = "TODO/REMOVE_TASK",
    TOGGLE_TASK_STATUS = "TODO/TOGGLE_TASK_STATUS",
    EDIT_TASK = "TODO/EDIT_TASK",
    CHANGE_TASKS_ORDER = "TODO/CHANGE_TASKS_ORDER"
}

// ---------------------------------------------------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------------------------------------------------

const todolistReducer = (state: TodoListStateType = initialState, action: TodoListActionTypes): TodoListStateType => {
    switch (action.type) {
        case TODO.SET_TASKS_DATA: {
            return {
                ...state,
                tasks: [...action.payload.tasks.sort((prev, next) => prev.order - next.order)]
            }
        }
        case TODO.SET_TASKS_IS_FETCHING: {
            return {
                ...state,
                isFetching: action.payload.isFetching
            }
        }
        case TODO.ADD_TASK: {
            const newTask: TaskDataType = {
                id: v1(),
                order: state.tasks.length + 1,
                title: action.payload.title,
                status: "active"
            }
            return {
                ...state,
                tasks: [...state.tasks, newTask]
            }
        }
        case TODO.REMOVE_TASK: {
            return {
                ...state,
                tasks: state.tasks.filter(task => task.id !== action.payload.id)
            }
        }
        case TODO.TOGGLE_TASK_STATUS: {
            return {
                ...state,
                tasks: state.tasks
                    .map(task => task.id === action.payload.id
                        ?
                        {...task, status: task.status === "active" ? "done" : "active"}
                        :
                        task
                    )
            }
        }
        case TODO.EDIT_TASK: {
            return {
                ...state,
                tasks: state.tasks
                    .map(task => task.id === action.payload.id
                        ?
                        {...task, title: action.payload.title}
                        :
                        task
                    )
            }
        }
        case TODO.CHANGE_TASKS_ORDER: {
            const orderedByIndex = arrayMove<TaskDataType>(
                state.tasks,
                action.payload.oldIndex,
                action.payload.newIndex
            )
            const orderFieldEqualsArrayIndex = orderedByIndex.map((task, index) => ({...task, order: index}))

            return {
                ...state,
                tasks: orderFieldEqualsArrayIndex
            }
        }
        default:
            return state
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// Action Creators
// ---------------------------------------------------------------------------------------------------------------------

export const setTasksAC = (tasks: TaskDataType[]) =>
    ({type: TODO.SET_TASKS_DATA, payload: {tasks}}) as const

export const setIsSyncing = (isFetching: boolean) =>
    ({type: TODO.SET_TASKS_IS_FETCHING, payload: {isFetching}}) as const


export const addTaskAC = (title: string) =>
    ({type: TODO.ADD_TASK, payload: {title}}) as const

export const removeTaskAC = (id: string) =>
    ({type: TODO.REMOVE_TASK, payload: {id}}) as const

export const toggleTaskStatusAC = (id: string) =>
    ({type: TODO.TOGGLE_TASK_STATUS, payload: {id}}) as const

export const editTaskTitleAC = (id: string, title: string) =>
    ({type: TODO.EDIT_TASK, payload: {id, title}}) as const

export const changeTaskOrderAC = (oldIndex: number, newIndex: number) =>
    ({type: TODO.CHANGE_TASKS_ORDER, payload: {oldIndex, newIndex}}) as const

// ---------------------------------------------------------------------------------------------------------------------
// Thunk Creators
// ---------------------------------------------------------------------------------------------------------------------

export const requestTasksTC = (): ThunkDispatchType => async (dispatch) => {
    dispatch(setIsSyncing(true))
    try {
        const res = await TASKS_API.get()
        dispatch(setTasksAC(res))
    } catch (err) { // FIXME
        dispatch(setNotificationMessageAC(NOTIFICATIONS.SYNC_ERROR, "error"))
    } finally {
        dispatch(setIsSyncing(false))
    }
}

export const updateTasksOrderTC = (oldIndex: number, newIndex: number): ThunkDispatchType => async (dispatch, getState) => {
    // First, make local changes in state, then synchronize them on the server
    dispatch(changeTaskOrderAC(oldIndex, newIndex))

    const {tasks} = getState().todolist
    dispatch(setIsSyncing(true))
    try {
        await TASKS_API.updateOrder(tasks)
    } catch (err) { // FIXME
        dispatch(setNotificationMessageAC(NOTIFICATIONS.SYNC_ERROR, "error"))
    } finally {
        dispatch(setIsSyncing(false))
    }
}


export const toggleTaskStatusTC = (id: string): ThunkDispatchType => async (dispatch, getState) => {
    dispatch(toggleTaskStatusAC(id))
    const {tasks} = getState().todolist

    const task = tasks.find(task => task.id === id)

    // Trying to sync
    if (task) {
        dispatch(setIsSyncing(true))
        try {
            await TASKS_API.update(id, task)
        } catch (err) { // FIXME
            // Returning the previous state
            dispatch(toggleTaskStatusAC(id))
            dispatch(setNotificationMessageAC(NOTIFICATIONS.SYNC_ERROR, "error"))
        } finally {
            dispatch(setIsSyncing(false))
        }
    }
}

export const editTaskTitleTC = (id: string, title: string): ThunkDispatchType => async (dispatch, getState) => {
    // Save original task title to be able to restore
    const originalTasks = getState().todolist.tasks
    const originalTask = originalTasks.find(task => task.id === id)
    const originalTaskTitle = originalTask && originalTask.title

    // Change local value
    dispatch(editTaskTitleAC(id, title))
    const modifiedTasks = getState().todolist.tasks
    const modifiedTask = modifiedTasks.find(task => task.id === id)

    // Trying to sync
    if (modifiedTask) {
        dispatch(setIsSyncing(true))
        try {
            await TASKS_API.update(id, modifiedTask)
        } catch (err) { // FIXME
            // Returning the previous state
            dispatch(editTaskTitleAC(id, originalTaskTitle ? originalTaskTitle : title))
            dispatch(setNotificationMessageAC(NOTIFICATIONS.SYNC_ERROR, "error"))
        } finally {
            dispatch(setIsSyncing(false))
        }
    }
}


export default todolistReducer
