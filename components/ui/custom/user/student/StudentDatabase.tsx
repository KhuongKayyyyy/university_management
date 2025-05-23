"use client";

import { cn, getClassNameById, getDepartmentNameById, getMajorNameById } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ColumnDef,
    ColumnFiltersState,
    FilterFn,
    PaginationState,
    Row,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    ChevronDown,
    ChevronFirst,
    ChevronLast,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    CircleAlert,
    CircleX,
    Columns3,
    Ellipsis,
    Filter,
    ListFilter,
    Plus,
    Trash,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import AddStudentSheet from "./AddStudentSheet";
import { classes, departmentData, students } from "@/app/api/fakedata";
import { Student } from "@/app/api/model/model";
import React from "react";
import StudentDetailDialog from "./StudentDetailDialog";

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<Student> = (row, filterValue) => {
    const searchableRowContent = `${row.original.name} ${row.original.studentEmail}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

const statusFilterFn: FilterFn<Student> = (row, columnId, filterValue: string[]) => {
    if (!filterValue?.length) return true;
    const status = row.getValue(columnId) as string;
    return filterValue.includes(status);
};


const columns: ColumnDef<Student>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        size: 28,
        enableSorting: false,
        enableHiding: false,
    },

    {
        header: "Student ID",
        accessorKey: "studentId",
        cell: ({ row }) => <div className="font-medium">{row.original.studentId}</div>,
        size: 180,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
    },
    {
        header: "Name",
        accessorKey: "name",
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
        size: 180,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
    },
    {
        header: "Email",
        accessorKey: "email",
        cell: ({ row }) => (
            <div>
                <span className="font-medium leading-none">{row.original.studentEmail}</span>
            </div>
        ),
        size: 220,
    },
    {
        header: "Location",
        accessorKey: "location",
        cell: ({ row }) => (
            <div>
                <span className="font-medium leading-none">{row.original.location}</span>
            </div>
        ),
        size: 180,
    },
    {
        header: "Birthday",
        accessorKey: "birthday",
        cell: ({ row }) => (
            <div>
                <span className="font-medium leading-none">{row.original.birthday}</span>
            </div>
        ),
        size: 120,
    },
    {
        header: "Major",
        accessorKey: "majorId",
        cell: ({ row }) => (
            <div>
                <span className="font-medium leading-none">{getMajorNameById(row.original.majorId)}</span>
            </div>
        ),
        size: 120,
    },
    {
        header: "Department",
        accessorKey: "departmentId",
        cell: ({ row }) => (
            <div>
                <span className="font-medium leading-none">{getDepartmentNameById(row.original.departmentId)}</span>
            </div>
        ),
        size: 120,
    },
    {
        header: "Class",
        accessorKey: "classId",
        cell: ({ row }) => (
            <div>
                <span className="font-medium leading-none">{getClassNameById(row.original.classId)}</span>
            </div>
        ),
        size: 120,
    },
    {
        header: "Status",
        accessorKey: "isActivated",
        cell: ({ row }) => (
            <Badge
                className={cn(
                    row.getValue("isActivated") === true
                        ? "bg-green-500 text-white"
                        : "bg-muted-foreground/60 text-primary-foreground",
                )
                }
            >
                {row.getValue("isActivated") === true ? "Active" : "Inactive"}
            </Badge>
        ),
        size: 100,
        filterFn: statusFilterFn,
    },
    {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <RowActions row={row} />,
        size: 60,
        enableHiding: false,
    },
];

export default function Database() {
    const id = useId();
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const inputRef = useRef<HTMLInputElement>(null);

    const [sorting, setSorting] = useState<SortingState>([
        {
            id: "name",
            desc: false,
        },
    ]);

    const [data, setData] = useState<Student[]>([]);
    useEffect(() => {
        async function fetchPosts() {
            // test fetch data
            // const res = await fetch(
            //     "https://res.cloudinary.com/dlzlfasou/raw/upload/users-01_fertyx.json",
            // );
            // const data = await res.json();
            const data = students;
            setData(data);
        }
        fetchPosts();
    }, []);

    const handleDeleteRows = () => {
        const selectedRows = table.getSelectedRowModel().rows;
        const updatedData = data.filter(
            (item) => !selectedRows.some((row) => String(row.original.id) === String(item.id)),
        );
        setData(updatedData);
        table.resetRowSelection();
    };

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        enableSortingRemoval: false,
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        state: {
            sorting,
            pagination,
            columnFilters,
            columnVisibility,
        },
    });
    const uniqueStatusValues = useMemo(() => {
        const statusColumn = table.getColumn("isActivated");

        if (!statusColumn) return [];

        const values = Array.from(statusColumn.getFacetedUniqueValues().keys());

        return values.sort();
    }, [table.getColumn("isActivated")?.getFacetedUniqueValues()]);

    // Get counts for each status
    const statusCounts = useMemo(() => {
        const statusColumn = table.getColumn("isActivated");
        if (!statusColumn) return new Map();
        return statusColumn.getFacetedUniqueValues();
    }, [table.getColumn("isActivated")?.getFacetedUniqueValues()]);

    const selectedStatuses = useMemo(() => {
        const filterValue = table.getColumn("isActivated")?.getFilterValue() as string[];
        return filterValue ?? [];
    }, [table.getColumn("isActivated")?.getFilterValue()]);

    const handleStatusChange = (checked: boolean, value: string) => {
        const filterValue = table.getColumn("isActivated")?.getFilterValue() as string[];
        const newFilterValue = filterValue ? [...filterValue] : [];

        if (checked) {
            newFilterValue.push(value);
        } else {
            const index = newFilterValue.indexOf(value);
            if (index > -1) {
                newFilterValue.splice(index, 1);
            }
        }

        table.getColumn("isActivated")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
    };

    return (
        <div className="space-y-4 max-w-full overflow-x-auto py-5">
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    {/* Filter by name or email */}
                    <div className="relative">
                        <Input
                            id={`${id}-input`}
                            ref={inputRef}
                            className={cn(
                                "peer min-w-60 ps-9 shadow-md",
                                Boolean(table.getColumn("name")?.getFilterValue() || table.getColumn("studentId")?.getFilterValue()) && "pe-9",
                            )}
                            value={(table.getColumn("name")?.getFilterValue() ?? table.getColumn("studentId")?.getFilterValue() ?? "") as string}
                            onChange={(e) => {
                                const value = e.target.value;
                                table.getColumn("name")?.setFilterValue(value);
                                table.getColumn("studentId")?.setFilterValue(value);
                            }}
                            placeholder="Filter by name, email, or student ID..."
                            type="text"
                            aria-label="Filter by name, email, or student ID"
                        />
                        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                            <ListFilter size={16} strokeWidth={2} aria-hidden="true" />
                        </div>
                        {Boolean(table.getColumn("name")?.getFilterValue() || table.getColumn("studentId")?.getFilterValue()) && (
                            <button
                                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Clear filter"
                                onClick={() => {
                                    table.getColumn("name")?.setFilterValue("");
                                    table.getColumn("studentId")?.setFilterValue("");
                                    if (inputRef.current) {
                                        inputRef.current.focus();
                                    }
                                }}
                            >
                                <CircleX size={16} strokeWidth={2} aria-hidden="true" />
                            </button>
                        )}
                    </div>

                    {/* Filter by status */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button className="shadow-md" variant="outline">
                                <Filter className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                                Status
                                {selectedStatuses.length > 0 && (
                                    <span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                                        {selectedStatuses.length}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="min-w-36 p-3" align="start">
                            <div className="space-y-3">
                                <div className="text-xs font-medium text-muted-foreground">Filters</div>
                                <div className="space-y-3">
                                    {uniqueStatusValues.map((value, i) => (
                                        <div key={value} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`${id}-${i}`}
                                                checked={selectedStatuses.includes(value)}
                                                onCheckedChange={(checked: boolean) => handleStatusChange(checked, value)}
                                            />
                                            <Label htmlFor={`${id}-${i}`} className="flex grow justify-between gap-2 font-normal">
                                                {value}
                                                <span className="ms-2 text-xs text-muted-foreground">
                                                    {value === true ? "Active" : "Inactive"} ({statusCounts.get(value)} )
                                                </span>
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Toggle columns visibility */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="shadow-md" variant="outline">
                                <Columns3 className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                                View
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        onSelect={(event) => event.preventDefault()}
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Delete + Add buttons */}
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                    {table.getSelectedRowModel().rows.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="bg-error text-white shadow-md" variant="outline">
                                    <Trash className="-ms-1 me-2 opacity-60 text-white" size={16} strokeWidth={2} aria-hidden="true" />
                                    Delete
                                    <span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                                        {table.getSelectedRowModel().rows.length}
                                    </span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border" aria-hidden="true">
                                        <CircleAlert className="opacity-80" size={16} strokeWidth={2} />
                                    </div>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete{" "}
                                            {table.getSelectedRowModel().rows.length} selected{" "}
                                            {table.getSelectedRowModel().rows.length === 1 ? "row" : "rows"}.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteRows}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <div>
                        <AddStudentSheet></AddStudentSheet>
                    </div>
                </div>
            </div>


            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-border bg-background">
                <Table className="min-w-full table-auto">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            style={{ width: `${header.getSize()}px` }}
                                            className="h-11"
                                        >
                                            {header.isPlaceholder ? null : header.column.getCanSort() ? (
                                                <div
                                                    className={cn(
                                                        header.column.getCanSort() &&
                                                        "flex h-full cursor-pointer select-none items-center justify-between gap-2",
                                                    )}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    onKeyDown={(e) => {
                                                        // Enhanced keyboard handling for sorting
                                                        if (
                                                            header.column.getCanSort() &&
                                                            (e.key === "Enter" || e.key === " ")
                                                        ) {
                                                            e.preventDefault();
                                                            header.column.getToggleSortingHandler()?.(e);
                                                        }
                                                    }}
                                                    tabIndex={header.column.getCanSort() ? 0 : undefined}
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {{
                                                        asc: (
                                                            <ChevronUp
                                                                className="shrink-0 opacity-60"
                                                                size={16}
                                                                strokeWidth={2}
                                                                aria-hidden="true"
                                                            />
                                                        ),
                                                        desc: (
                                                            <ChevronDown
                                                                className="shrink-0 opacity-60"
                                                                size={16}
                                                                strokeWidth={2}
                                                                aria-hidden="true"
                                                            />
                                                        ),
                                                    }[header.column.getIsSorted() as string] ?? null}
                                                </div>
                                            ) : (
                                                flexRender(header.column.columnDef.header, header.getContext())
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="last:py-0">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-8">
                {/* Results per page */}
                <div className="flex items-center gap-3">
                    <Label htmlFor={id} className="max-sm:sr-only text-primary">
                        Rows per page
                    </Label>
                    <Select
                        value={table.getState().pagination.pageSize.toString()}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value));
                        }}
                    >
                        <SelectTrigger id={id} className="w-fit whitespace-nowrap">
                            <SelectValue placeholder="Select number of results" />
                        </SelectTrigger>
                        <SelectContent className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
                            {[5, 10, 25, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={pageSize.toString()}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {/* Page number information */}
                <div className="flex grow justify-end whitespace-nowrap text-sm text-muted-foreground">
                    <p className="whitespace-nowrap text-sm text-muted-foreground" aria-live="polite">
                        <span className="text-foreground">
                            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                            {Math.min(
                                Math.max(
                                    table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
                                    table.getState().pagination.pageSize,
                                    0,
                                ),
                                table.getRowCount(),
                            )}
                        </span>{" "}
                        of <span className="text-foreground">{table.getRowCount().toString()}</span>
                    </p>
                </div>

                {/* Pagination buttons */}
                <div>
                    <Pagination>
                        <PaginationContent>
                            {/* First page button */}
                            <PaginationItem>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="disabled:pointer-events-none disabled:opacity-50"
                                    onClick={() => table.firstPage()}
                                    disabled={!table.getCanPreviousPage()}
                                    aria-label="Go to first page"
                                >
                                    <ChevronFirst size={16} strokeWidth={2} aria-hidden="true" />
                                </Button>
                            </PaginationItem>
                            {/* Previous page button */}
                            <PaginationItem>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="disabled:pointer-events-none disabled:opacity-50"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                    aria-label="Go to previous page"
                                >
                                    <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                                </Button>
                            </PaginationItem>
                            {/* Next page button */}
                            <PaginationItem>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="disabled:pointer-events-none disabled:opacity-50"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                    aria-label="Go to next page"
                                >
                                    <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                                </Button>
                            </PaginationItem>
                            {/* Last page button */}
                            <PaginationItem>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="disabled:pointer-events-none disabled:opacity-50"
                                    onClick={() => table.lastPage()}
                                    disabled={!table.getCanNextPage()}
                                    aria-label="Go to last page"
                                >
                                    <ChevronLast size={16} strokeWidth={2} aria-hidden="true" />
                                </Button>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </div>
    );
}

function RowActions({ row }: { row: Row<Student> }) {

    const student = row.original;
    const [openDialog, setOpenDialog] = React.useState(false);
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex justify-end">
                        <Button size="icon" variant="ghost" className="shadow-none" aria-label="Edit item">
                            <Ellipsis size={16} strokeWidth={2} aria-hidden="true" />
                        </Button>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => setOpenDialog(true)}>
                                <span>Edit</span>
                                <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuItem>
                            <span>Duplicate</span>
                            <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem>
                            <span>Archive</span>
                            <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem>Move to project</DropdownMenuItem>
                                    <DropdownMenuItem>Move to folder</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>Advanced options</DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem>Share</DropdownMenuItem>
                        <DropdownMenuItem>Add to favorites</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                        <span>Delete</span>
                        <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            {/* Ensure StudentDetailDialog is imported or defined */}
            <StudentDetailDialog
                student={student}
                open={openDialog}
                onOpenChange={setOpenDialog}
            ></StudentDetailDialog>
        </>

    );
}

export { Database as Component }