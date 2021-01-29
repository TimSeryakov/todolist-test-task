import React, {ChangeEvent, useCallback, useState} from 'react'
import {TaskItem} from '../TaskItem/TaskItem'
import {RootStateType} from '../../redux/store'
import {useDispatch, useSelector} from 'react-redux'
import {addTaskAC, changeTaskOrderAC, editTaskAC, removeTaskAC, toggleTaskStatusAC} from '../../redux/todolist-reducer'
import {List} from 'react-movable'

// ---------------------------------------------------------------------------------------------------------------------

export const TodoList = () => {

    const selector = useCallback((state: RootStateType) => state.todolist, [])
    const {todoListData} = useSelector(selector)
    const dispatch = useDispatch()

    const editTask = (id: string, newValue: string) => {
        dispatch(editTaskAC(id, newValue))
    }
    const toggleStatus = (id: string) => {
        dispatch(toggleTaskStatusAC(id))
    }
    const removeTask = (id: string) => {
        dispatch(removeTaskAC(id))
    }

// ---------------------------------------------------------------------------------------------------------------------

    return (
        <section className="my-12">
            <Header/>
            <AddTaskInput/>
            <main>
                <List
                    values={todoListData}
                    onChange={({oldIndex, newIndex}) =>
                        dispatch(changeTaskOrderAC(oldIndex, newIndex))
                    }
                    renderList={({children, props}) => {
                        return <ul {...props}>{children}</ul>
                    }}
                    renderItem={({value, props}) => {
                        return <TaskItem {...props}
                                         id={value.id}
                                         status={value.status}
                                         title={value.title}
                                         removeTask={removeTask}
                                         toggleStatus={toggleStatus}
                                         editTask={editTask}
                        />
                    }}
                />
            </main>
        </section>
    )
}
//----------------------------------------------------------------------------------------------------------------------
// Built-in components
//----------------------------------------------------------------------------------------------------------------------

// Just header
const Header = () => {
    return (
        <header className="text-gb-text opacity-40 focus:outline-none pb-14">
            <a href="https://youtu.be/5coefdzLlYc" target="_blank" rel="noreferrer" className="focus:outline-none">
                <h1 className="text-4xl mb-3">Watcha gonna do, whatcha gonna do</h1>
                <h2 className="text-xl my-1">When they come for you</h2>
                <h3 className="text-sm">Bad boys, bad boys...</h3>
            </a>
        </header>
    )
}

// Input for task creating
const AddTaskInput = () => {
    const [typedText, setTypedText] = useState<string | null>()
    const dispatch = useDispatch()

    const addTask = () => {
        if (typedText) {
            dispatch(addTaskAC(typedText))
            setTypedText(null)
        }
    }

    const inputOnChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
        setTypedText(e.currentTarget.value)
    }

    const inputOnKeyPressHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && typedText) {
            dispatch(addTaskAC(typedText))
            setTypedText(null)
        }
    }

    return (
        <div className="mt-10 mb-5 flex">
            <input value={typedText ? typedText : ""}
                   type="input"
                   placeholder="Type something..."
                   className="bg-gb-dark-medium text-gb-light border-gb-text
                              p-3 text-2xl mr-1 border-b-2
                              placeholder-gb-dark-soft focus:outline-none flex-auto"
                   onChange={inputOnChangeHandler}
                   onKeyPress={inputOnKeyPressHandler}
            />
            <button className="ml-1 px-1 text-gb-text opacity-75 hover:opacity-100 focus:outline-none"
                    onClick={addTask}
            >
                <AddIcon/>
            </button>
        </div>
    )
}

// Icons (SVG)
//----------------------------------------------------------------------------------------------------------------------

const AddIcon = () => {
    return (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
             xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z"
            />
        </svg>
    )
}